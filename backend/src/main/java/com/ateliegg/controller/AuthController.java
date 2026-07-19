package com.ateliegg.controller;

import com.ateliegg.dto.auth.*;
import com.ateliegg.service.AuthService;
import com.ateliegg.service.GoogleAuthService;
import com.ateliegg.service.PasswordResetService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Autenticação")
public class AuthController {

    private final AuthService authService;
    private final PasswordResetService passwordResetService;
    private final GoogleAuthService googleAuthService;

    @PostMapping("/login")
    @Operation(summary = "Realizar login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/google/config")
    @Operation(summary = "Configuração pública do login Google")
    public GoogleConfigResponse googleConfig() {
        return googleAuthService.getConfig();
    }

    @PostMapping("/google")
    @Operation(summary = "Login / cadastro com Google (ID token)")
    public AuthResponse google(@Valid @RequestBody GoogleAuthRequest request) {
        return googleAuthService.authenticate(request);
    }

    @PostMapping(value = "/register", consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Criar conta de cliente (JSON)")
    public AuthResponse registerJson(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping(value = "/register", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Criar conta de cliente com foto")
    public AuthResponse registerWithPhoto(
            @Valid @ModelAttribute RegisterRequest request,
            @RequestParam(value = "photo", required = false) MultipartFile photo) {
        return authService.register(request, photo);
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Solicitar código de recuperação de senha por email")
    public MessageResponse forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        return passwordResetService.requestReset(request);
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Redefinir senha com código de verificação")
    public MessageResponse resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        return passwordResetService.resetPassword(request);
    }
}
