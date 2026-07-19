package com.ateliegg.service;

import com.ateliegg.domain.entity.User;
import com.ateliegg.domain.enums.UserRole;
import com.ateliegg.dto.auth.AuthResponse;
import com.ateliegg.dto.auth.LoginRequest;
import com.ateliegg.dto.auth.RegisterRequest;
import com.ateliegg.exception.BusinessException;
import com.ateliegg.repository.UserRepository;
import com.ateliegg.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final FileStorageService fileStorageService;

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BusinessException("Usuário não encontrado", HttpStatus.NOT_FOUND));

        String token = jwtService.generateToken(request.getEmail(), Map.of(
                "role", user.getRole().name(),
                "userId", user.getId()
        ));

        return buildAuthResponse(user, token);
    }

    @Transactional
    public AuthResponse register(RegisterRequest request, MultipartFile photo) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException("Email já cadastrado");
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(UserRole.CLIENTE)
                .phone(request.getPhone())
                .cpf(request.getCpf())
                .active(true)
                .build();

        user = userRepository.save(user);

        if (photo != null && !photo.isEmpty()) {
            String photoUrl = fileStorageService.storeUserPhoto(photo, user.getId());
            user.setProfilePhotoUrl(photoUrl);
            user = userRepository.save(user);
        }

        String token = jwtService.generateToken(user.getEmail(), Map.of(
                "role", user.getRole().name(),
                "userId", user.getId()
        ));

        return buildAuthResponse(user, token);
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        return register(request, null);
    }

    private AuthResponse buildAuthResponse(User user, String token) {
        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .profilePhotoUrl(user.getProfilePhotoUrl())
                .build();
    }
}
