package com.ateliegg.controller;

import com.ateliegg.dto.cms.HeroFeatureOrderRequest;
import com.ateliegg.dto.cms.HeroFeatureRequest;
import com.ateliegg.dto.cms.HeroFeatureResponse;
import com.ateliegg.dto.cms.HeroSectionRequest;
import com.ateliegg.dto.cms.HeroSectionResponse;
import com.ateliegg.service.HeroCmsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/cms/hero")
@RequiredArgsConstructor
@Tag(name = "CMS Hero")
public class HeroCmsController {

    private final HeroCmsService heroCmsService;

    @GetMapping
    @Operation(summary = "Obter Hero ativa (público)")
    public HeroSectionResponse getHero() {
        return heroCmsService.getPublicHero();
    }

    @PutMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'GERENTE')")
    @Operation(summary = "Atualizar Hero")
    public HeroSectionResponse updateHero(@Valid @RequestBody HeroSectionRequest request) {
        return heroCmsService.updateHero(request);
    }

    @PostMapping("/reset")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Restaurar Hero padrão")
    public HeroSectionResponse resetHero() {
        return heroCmsService.resetToDefaults();
    }

    @PostMapping(value = "/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN', 'GERENTE')")
    @Operation(summary = "Upload imagem principal da Hero")
    public HeroSectionResponse uploadImage(@RequestParam("file") MultipartFile file) {
        return heroCmsService.uploadHeroImage(file);
    }

    @DeleteMapping("/image")
    @PreAuthorize("hasAnyRole('ADMIN', 'GERENTE')")
    @Operation(summary = "Remover imagem principal (volta ao padrão)")
    public HeroSectionResponse removeImage() {
        return heroCmsService.removeHeroImage();
    }

    @PostMapping(value = "/logo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN', 'GERENTE')")
    @Operation(summary = "Upload logo da Hero")
    public HeroSectionResponse uploadLogo(@RequestParam("file") MultipartFile file) {
        return heroCmsService.uploadLogoImage(file);
    }

    @DeleteMapping("/logo")
    @PreAuthorize("hasAnyRole('ADMIN', 'GERENTE')")
    @Operation(summary = "Remover logo da Hero")
    public HeroSectionResponse removeLogo() {
        return heroCmsService.removeLogoImage();
    }

    @PostMapping("/features")
    @PreAuthorize("hasAnyRole('ADMIN', 'GERENTE')")
    @Operation(summary = "Adicionar badge/feature")
    public HeroFeatureResponse addFeature(@Valid @RequestBody HeroFeatureRequest request) {
        return heroCmsService.addFeature(request);
    }

    @PutMapping("/features/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'GERENTE')")
    @Operation(summary = "Atualizar badge/feature")
    public HeroFeatureResponse updateFeature(
            @PathVariable Long id,
            @Valid @RequestBody HeroFeatureRequest request) {
        return heroCmsService.updateFeature(id, request);
    }

    @DeleteMapping("/features/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'GERENTE')")
    @Operation(summary = "Remover badge/feature")
    public void deleteFeature(@PathVariable Long id) {
        heroCmsService.deleteFeature(id);
    }

    @PatchMapping("/features/order")
    @PreAuthorize("hasAnyRole('ADMIN', 'GERENTE')")
    @Operation(summary = "Reordenar badges")
    public HeroSectionResponse reorderFeatures(@Valid @RequestBody HeroFeatureOrderRequest request) {
        return heroCmsService.reorderFeatures(request);
    }
}
