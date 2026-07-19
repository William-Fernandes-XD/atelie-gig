package com.ateliegg.service;

import com.ateliegg.config.AtelieProperties;
import com.ateliegg.domain.entity.User;
import com.ateliegg.domain.enums.UserRole;
import com.ateliegg.dto.auth.AuthResponse;
import com.ateliegg.dto.auth.GoogleAuthRequest;
import com.ateliegg.dto.auth.GoogleConfigResponse;
import com.ateliegg.exception.BusinessException;
import com.ateliegg.repository.UserRepository;
import com.ateliegg.security.JwtService;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.Collections;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class GoogleAuthService {

    private final AtelieProperties properties;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public GoogleConfigResponse getConfig() {
        String clientId = properties.getGoogle().getClientId();
        boolean enabled = StringUtils.hasText(clientId);
        return GoogleConfigResponse.builder()
                .clientId(enabled ? clientId : null)
                .enabled(enabled)
                .build();
    }

    @Transactional
    public AuthResponse authenticate(GoogleAuthRequest request) {
        String clientId = properties.getGoogle().getClientId();
        if (!StringUtils.hasText(clientId)) {
            throw new BusinessException(
                    "Login com Google não configurado. Defina GOOGLE_CLIENT_ID no .env",
                    HttpStatus.SERVICE_UNAVAILABLE);
        }

        GoogleIdToken.Payload payload = verifyToken(request.getIdToken(), clientId);
        String email = payload.getEmail();
        if (!StringUtils.hasText(email)) {
            throw new BusinessException("Conta Google sem e-mail disponível", HttpStatus.BAD_REQUEST);
        }
        if (!Boolean.TRUE.equals(payload.getEmailVerified())) {
            throw new BusinessException("E-mail Google não verificado", HttpStatus.BAD_REQUEST);
        }

        String name = StringUtils.hasText((String) payload.get("name"))
                ? (String) payload.get("name")
                : email.split("@")[0];
        String picture = (String) payload.get("picture");

        User user = userRepository.findByEmail(email.toLowerCase())
                .orElseGet(() -> createGoogleUser(email.toLowerCase(), name, picture));

        if (!Boolean.TRUE.equals(user.getActive())) {
            throw new BusinessException("Conta desativada", HttpStatus.FORBIDDEN);
        }

        // Atualiza nome/foto se ainda vazios (primeira vez ou perfil incompleto)
        boolean dirty = false;
        if (!StringUtils.hasText(user.getName()) && StringUtils.hasText(name)) {
            user.setName(name);
            dirty = true;
        }
        if (!StringUtils.hasText(user.getProfilePhotoUrl()) && StringUtils.hasText(picture)) {
            user.setProfilePhotoUrl(picture);
            dirty = true;
        }
        if (dirty) {
            user = userRepository.save(user);
        }

        String token = jwtService.generateToken(user.getEmail(), Map.of(
                "role", user.getRole().name(),
                "userId", user.getId()
        ));

        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .profilePhotoUrl(user.getProfilePhotoUrl())
                .build();
    }

    private User createGoogleUser(String email, String name, String picture) {
        User user = User.builder()
                .name(name)
                .email(email)
                // Senha aleatória: login por e-mail/senha fica indisponível até redefinir
                .password(passwordEncoder.encode("google:" + UUID.randomUUID()))
                .role(UserRole.CLIENTE)
                .profilePhotoUrl(picture)
                .active(true)
                .build();
        log.info("Nova conta via Google: {}", email);
        return userRepository.save(user);
    }

    private GoogleIdToken.Payload verifyToken(String idToken, String clientId) {
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(),
                    GsonFactory.getDefaultInstance())
                    .setAudience(Collections.singletonList(clientId))
                    .build();

            GoogleIdToken googleIdToken = verifier.verify(idToken);
            if (googleIdToken == null) {
                throw new BusinessException("Token Google inválido", HttpStatus.UNAUTHORIZED);
            }
            return googleIdToken.getPayload();
        } catch (BusinessException ex) {
            throw ex;
        } catch (Exception ex) {
            log.warn("Falha ao validar token Google: {}", ex.getMessage());
            throw new BusinessException("Não foi possível validar o login Google", HttpStatus.UNAUTHORIZED);
        }
    }
}
