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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class PasswordResetService {

    private static final int CODE_EXPIRATION_MINUTES = 15;

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    @Transactional
    public MessageResponse requestReset(ForgotPasswordRequest request) {
        userRepository.findByEmail(request.getEmail()).ifPresent(user -> {
            tokenRepository.invalidateAllForUser(user.getId());

            String code = generateCode();
            PasswordResetToken token = PasswordResetToken.builder()
                    .user(user)
                    .code(code)
                    .expiresAt(LocalDateTime.now().plusMinutes(CODE_EXPIRATION_MINUTES))
                    .used(false)
                    .build();

            tokenRepository.save(token);
            emailService.sendPasswordResetCode(user.getEmail(), user.getName(), code);
        });

        return new MessageResponse(
                "Se o email estiver cadastrado, enviamos um código de verificação para redefinir sua senha.");
    }

    @Transactional
    public MessageResponse resetPassword(ResetPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BusinessException("Código inválido ou expirado"));

        PasswordResetToken token = tokenRepository
                .findByUserIdAndCodeAndUsedFalse(user.getId(), request.getCode())
                .orElseThrow(() -> new BusinessException("Código inválido ou expirado"));

        if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
            token.setUsed(true);
            tokenRepository.save(token);
            throw new BusinessException("Código expirado. Solicite um novo código.");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        token.setUsed(true);
        tokenRepository.save(token);
        tokenRepository.invalidateAllForUser(user.getId());

        return new MessageResponse("Senha redefinida com sucesso. Você já pode fazer login.");
    }

    private String generateCode() {
        SecureRandom random = new SecureRandom();
        int value = 100000 + random.nextInt(900000);
        return String.valueOf(value);
    }
}
