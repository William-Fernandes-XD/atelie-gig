package com.ateliegg.service;

import com.ateliegg.domain.entity.PasswordResetToken;
import com.ateliegg.domain.entity.User;
import com.ateliegg.dto.auth.ForgotPasswordRequest;
import com.ateliegg.dto.auth.MessageResponse;
import com.ateliegg.dto.auth.ResetPasswordRequest;
import com.ateliegg.exception.BusinessException;
import com.ateliegg.repository.PasswordResetTokenRepository;
import com.ateliegg.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;

@Service
@RequiredArgsConstructor
public class PasswordResetService {

    private static final int CODE_EXPIRATION_MINUTES = 15;
    private static final int MAX_RESET_ATTEMPTS = 5;
    private static final int LOCK_SECONDS = 900;
    private static final int FORGOT_COOLDOWN_SECONDS = 60;

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final Environment environment;

    private final ConcurrentHashMap<String, Instant> forgotCooldown = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, AttemptState> resetAttempts = new ConcurrentHashMap<>();

    @Transactional
    public MessageResponse requestReset(ForgotPasswordRequest request) {
        String emailKey = normalize(request.getEmail());
        assertForgotCooldown(emailKey);
        forgotCooldown.put(emailKey, Instant.now().plusSeconds(FORGOT_COOLDOWN_SECONDS));

        AtomicReference<String> issuedCode = new AtomicReference<>();
        AtomicBoolean emailSent = new AtomicBoolean(false);

        userRepository.findByEmail(emailKey).ifPresent(user -> {
            tokenRepository.invalidateAllForUser(user.getId());

            String code = generateCode();
            PasswordResetToken token = PasswordResetToken.builder()
                    .user(user)
                    .code(passwordEncoder.encode(code))
                    .expiresAt(LocalDateTime.now().plusMinutes(CODE_EXPIRATION_MINUTES))
                    .used(false)
                    .build();

            tokenRepository.save(token);
            issuedCode.set(code);

            try {
                emailService.sendPasswordResetCode(user.getEmail(), user.getName(), code);
                emailSent.set(true);
            } catch (RuntimeException ex) {
                // SMTP falhou — em desenvolvimento liberamos o código na tela
            }
        });

        // Conta existe, e-mail não saiu
        if (issuedCode.get() != null && !emailSent.get()) {
            if (isDevelopment()) {
                return new MessageResponse(
                        "O e-mail não pôde ser enviado agora. Em modo de teste, use o código abaixo para continuar.",
                        issuedCode.get());
            }
            throw new BusinessException(
                    "Não foi possível enviar o e-mail no momento. Tente novamente em alguns minutos.",
                    HttpStatus.SERVICE_UNAVAILABLE);
        }

        return new MessageResponse(
                "Se o email estiver cadastrado, enviamos um código de verificação para redefinir sua senha.");
    }

    @Transactional
    public MessageResponse resetPassword(ResetPasswordRequest request) {
        String emailKey = normalize(request.getEmail());
        assertResetNotLocked(emailKey);

        User user = userRepository.findByEmail(emailKey).orElse(null);
        if (user == null) {
            registerResetFailure(emailKey);
            throw new BusinessException("Código inválido ou expirado");
        }

        PasswordResetToken token = tokenRepository
                .findTopByUserIdAndUsedFalseOrderByCreatedAtDesc(user.getId())
                .orElse(null);

        if (token == null
                || token.getExpiresAt().isBefore(LocalDateTime.now())
                || !passwordEncoder.matches(request.getCode(), token.getCode())) {
            registerResetFailure(emailKey);
            if (token != null && token.getExpiresAt().isBefore(LocalDateTime.now())) {
                token.setUsed(true);
                tokenRepository.save(token);
                throw new BusinessException("Código expirado. Solicite um novo código.");
            }
            throw new BusinessException("Código inválido ou expirado");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        token.setUsed(true);
        tokenRepository.save(token);
        tokenRepository.invalidateAllForUser(user.getId());
        resetAttempts.remove(emailKey);

        return new MessageResponse("Senha redefinida com sucesso. Você já pode fazer login.");
    }

    private boolean isDevelopment() {
        return !"production".equalsIgnoreCase(environment.getProperty("APP_ENV", "development"));
    }

    private void assertForgotCooldown(String emailKey) {
        Instant until = forgotCooldown.get(emailKey);
        if (until != null && Instant.now().isBefore(until)) {
            long remaining = Math.max(1, until.getEpochSecond() - Instant.now().getEpochSecond());
            throw new BusinessException(
                    "Aguarde " + remaining + "s antes de solicitar outro código.",
                    HttpStatus.TOO_MANY_REQUESTS);
        }
    }

    private void assertResetNotLocked(String emailKey) {
        AttemptState state = resetAttempts.get(emailKey);
        if (state == null || state.lockedUntil == null) {
            return;
        }
        if (Instant.now().isBefore(state.lockedUntil)) {
            throw new BusinessException(
                    "Muitas tentativas incorretas. Aguarde alguns minutos e tente novamente.",
                    HttpStatus.TOO_MANY_REQUESTS);
        }
    }

    private void registerResetFailure(String emailKey) {
        resetAttempts.compute(emailKey, (k, current) -> {
            int failures = (current == null ? 0 : current.failures) + 1;
            Instant lockedUntil = failures >= MAX_RESET_ATTEMPTS
                    ? Instant.now().plusSeconds(LOCK_SECONDS)
                    : null;
            return new AttemptState(failures, lockedUntil);
        });
    }

    private static String normalize(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    private String generateCode() {
        SecureRandom random = new SecureRandom();
        int value = 100000 + random.nextInt(900000);
        return String.valueOf(value);
    }

    private static final class AttemptState {
        private final int failures;
        private final Instant lockedUntil;

        private AttemptState(int failures, Instant lockedUntil) {
            this.failures = failures;
            this.lockedUntil = lockedUntil;
        }
    }
}
