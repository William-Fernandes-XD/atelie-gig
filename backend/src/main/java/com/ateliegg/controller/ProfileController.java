package com.ateliegg.controller;

import com.ateliegg.dto.profile.ProfileResponse;
import com.ateliegg.dto.profile.UpdateProfileRequest;
import com.ateliegg.service.ProfileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/me")
@RequiredArgsConstructor
@Tag(name = "Meu perfil")
@SecurityRequirement(name = "Bearer Authentication")
public class ProfileController {

    private final ProfileService profileService;

    @GetMapping
    @Operation(summary = "Obter dados do perfil e endereço padrão")
    public ProfileResponse getProfile() {
        return profileService.getProfile();
    }

    @PutMapping
    @Operation(summary = "Atualizar dados pessoais e endereço de entrega")
    public ProfileResponse updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        return profileService.updateProfile(request);
    }

    @PostMapping(value = "/photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Atualizar foto de perfil")
    public ProfileResponse updatePhoto(@RequestParam("photo") MultipartFile photo) {
        return profileService.updatePhoto(photo);
    }
}
