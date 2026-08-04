package com.ateliegg.service;

import com.ateliegg.domain.entity.HeroFeature;
import com.ateliegg.domain.entity.HeroSection;
import com.ateliegg.dto.cms.HeroFeatureOrderRequest;
import com.ateliegg.dto.cms.HeroFeatureRequest;
import com.ateliegg.dto.cms.HeroFeatureResponse;
import com.ateliegg.dto.cms.HeroSectionRequest;
import com.ateliegg.dto.cms.HeroSectionResponse;
import com.ateliegg.exception.BusinessException;
import com.ateliegg.repository.HeroFeatureRepository;
import com.ateliegg.repository.HeroSectionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HeroCmsService {

    public static final String DEFAULT_HERO_IMAGE = "/images/hero-boutique.png";

    private final HeroSectionRepository heroSectionRepository;
    private final HeroFeatureRepository heroFeatureRepository;
    private final FileStorageService fileStorageService;

    @Transactional(readOnly = true)
    public HeroSectionResponse getPublicHero() {
        return heroSectionRepository.findActiveWithFeatures()
                .map(this::toResponse)
                .orElseGet(this::defaultResponse);
    }

    @Transactional
    public HeroSectionResponse updateHero(HeroSectionRequest request) {
        HeroSection section = getOrCreateActive();
        applyFields(section, request);
        if (request.getFeatures() != null) {
            replaceFeatures(section, request.getFeatures());
        }
        return toResponse(heroSectionRepository.save(section));
    }

    @Transactional
    public HeroSectionResponse resetToDefaults() {
        HeroSection section = getOrCreateActive();
        deleteStoredUpload(section.getHeroImageUrl());
        deleteStoredUpload(section.getLogoImageUrl());
        deleteStoredUpload(section.getBackgroundImageUrl());

        section.setTitleLine1("Vestidos que contam");
        section.setTitleLine2("histórias");
        section.setTitleLine2Color("#9B8FD9");
        section.setTitleFontWeight("bold");
        section.setTitleFontSize("md");
        section.setDescription("Descubra peças exclusivas da GIG, criadas com elegância para mulheres especiais.");
        section.setButtonText("Conheça a coleção");
        section.setButtonLink("#colecao");
        section.setButtonBackground("#E8A8B8");
        section.setButtonTextColor("#2B2B2B");
        section.setButtonBorderRadius("full");
        section.setButtonVisible(true);
        section.setButtonHoverBackground("#E0A4AE");
        section.setSecondaryButton1Text(null);
        section.setSecondaryButton1Url(null);
        section.setSecondaryButton1Color(null);
        section.setSecondaryButton1Visible(false);
        section.setSecondaryButton2Text(null);
        section.setSecondaryButton2Url(null);
        section.setSecondaryButton2Color(null);
        section.setSecondaryButton2Visible(false);
        section.setHeroImageUrl(DEFAULT_HERO_IMAGE);
        section.setLogoImageUrl(null);
        section.setBackgroundType("gradient");
        section.setBackgroundColor(null);
        section.setBackgroundGradient("from-[#F7E6EA] via-[#FBF3F5] to-[#F3DDE3]");
        section.setBackgroundImageUrl(null);
        section.setOverlayColor(null);
        section.setOverlayOpacity(BigDecimal.ZERO);
        section.setTextAlignment("center");
        section.setHeroHeight("medium");
        section.setImagePosition("right");

        section.getFeatures().clear();
        section.getFeatures().add(buildFeature(section, "dress", "Peças exclusivas", 0));
        section.getFeatures().add(buildFeature(section, "heart", "Feito para você", 1));
        section.getFeatures().add(buildFeature(section, "sparkle", "Elegância em cada detalhe", 2));

        return toResponse(heroSectionRepository.save(section));
    }

    @Transactional
    public HeroSectionResponse uploadHeroImage(MultipartFile file) {
        HeroSection section = getOrCreateActive();
        String previous = section.getHeroImageUrl();
        String url = fileStorageService.storeHeroImage(file, "main");
        section.setHeroImageUrl(url);
        HeroSection saved = heroSectionRepository.save(section);
        deleteStoredUpload(previous);
        return toResponse(saved);
    }

    @Transactional
    public HeroSectionResponse uploadLogoImage(MultipartFile file) {
        HeroSection section = getOrCreateActive();
        String previous = section.getLogoImageUrl();
        String url = fileStorageService.storeHeroImage(file, "logo");
        section.setLogoImageUrl(url);
        HeroSection saved = heroSectionRepository.save(section);
        deleteStoredUpload(previous);
        return toResponse(saved);
    }

    @Transactional
    public HeroSectionResponse removeHeroImage() {
        HeroSection section = getOrCreateActive();
        deleteStoredUpload(section.getHeroImageUrl());
        section.setHeroImageUrl(DEFAULT_HERO_IMAGE);
        return toResponse(heroSectionRepository.save(section));
    }

    @Transactional
    public HeroSectionResponse removeLogoImage() {
        HeroSection section = getOrCreateActive();
        deleteStoredUpload(section.getLogoImageUrl());
        section.setLogoImageUrl(null);
        return toResponse(heroSectionRepository.save(section));
    }

    @Transactional
    public HeroFeatureResponse addFeature(HeroFeatureRequest request) {
        HeroSection section = getOrCreateActive();
        int nextOrder = section.getFeatures().stream()
                .mapToInt(HeroFeature::getDisplayOrder)
                .max()
                .orElse(-1) + 1;
        HeroFeature feature = buildFeature(
                section,
                request.getIcon(),
                request.getTitle(),
                request.getDisplayOrder() != null ? request.getDisplayOrder() : nextOrder
        );
        section.getFeatures().add(feature);
        heroSectionRepository.save(section);
        return toFeatureResponse(feature);
    }

    @Transactional
    public HeroFeatureResponse updateFeature(Long featureId, HeroFeatureRequest request) {
        HeroFeature feature = getFeature(featureId);
        feature.setIcon(request.getIcon());
        feature.setTitle(request.getTitle());
        if (request.getDisplayOrder() != null) {
            feature.setDisplayOrder(request.getDisplayOrder());
        }
        return toFeatureResponse(heroFeatureRepository.save(feature));
    }

    @Transactional
    public void deleteFeature(Long featureId) {
        HeroFeature feature = getFeature(featureId);
        HeroSection section = feature.getHeroSection();
        section.getFeatures().remove(feature);
        heroSectionRepository.save(section);
    }

    @Transactional
    public HeroSectionResponse reorderFeatures(HeroFeatureOrderRequest request) {
        HeroSection section = getOrCreateActive();
        Map<Long, HeroFeature> byId = section.getFeatures().stream()
                .collect(Collectors.toMap(HeroFeature::getId, Function.identity()));

        List<Long> ids = request.getFeatureIds();
        if (ids == null || ids.isEmpty()) {
            throw new BusinessException("Lista de features é obrigatória");
        }
        if (ids.size() != byId.size() || !byId.keySet().containsAll(ids)) {
            throw new BusinessException("IDs de features inválidos para reordenação");
        }

        for (int i = 0; i < ids.size(); i++) {
            byId.get(ids.get(i)).setDisplayOrder(i);
        }
        section.getFeatures().sort(Comparator.comparingInt(HeroFeature::getDisplayOrder).thenComparing(HeroFeature::getId));
        return toResponse(heroSectionRepository.save(section));
    }

    private HeroSection getOrCreateActive() {
        return heroSectionRepository.findActiveWithFeatures().orElseGet(() -> {
            HeroSection created = HeroSection.builder()
                    .active(true)
                    .titleLine1("Vestidos que contam")
                    .titleLine2("histórias")
                    .titleLine2Color("#9B8FD9")
                    .description("Descubra peças exclusivas da GIG, criadas com elegância para mulheres especiais.")
                    .buttonText("Conheça a coleção")
                    .buttonLink("#colecao")
                    .buttonBackground("#E8A8B8")
                    .buttonTextColor("#2B2B2B")
                    .buttonHoverBackground("#E0A4AE")
                    .heroImageUrl(DEFAULT_HERO_IMAGE)
                    .backgroundType("gradient")
                    .backgroundGradient("from-[#F7E6EA] via-[#FBF3F5] to-[#F3DDE3]")
                    .features(new ArrayList<>())
                    .build();
            created.getFeatures().add(buildFeature(created, "dress", "Peças exclusivas", 0));
            created.getFeatures().add(buildFeature(created, "heart", "Feito para você", 1));
            created.getFeatures().add(buildFeature(created, "sparkle", "Elegância em cada detalhe", 2));
            return heroSectionRepository.save(created);
        });
    }

    private HeroFeature getFeature(Long featureId) {
        return heroFeatureRepository.findById(featureId)
                .orElseThrow(() -> new BusinessException("Feature não encontrada", HttpStatus.NOT_FOUND));
    }

    private void applyFields(HeroSection section, HeroSectionRequest request) {
        section.setTitleLine1(request.getTitleLine1());
        section.setTitleLine2(request.getTitleLine2());
        section.setTitleLine2Color(request.getTitleLine2Color());
        if (request.getTitleFontWeight() != null) {
            section.setTitleFontWeight(request.getTitleFontWeight());
        }
        if (request.getTitleFontSize() != null) {
            section.setTitleFontSize(request.getTitleFontSize());
        }
        section.setDescription(request.getDescription());
        section.setButtonText(request.getButtonText());
        section.setButtonLink(request.getButtonLink());
        section.setButtonBackground(request.getButtonBackground());
        section.setButtonTextColor(request.getButtonTextColor());
        if (request.getButtonBorderRadius() != null) {
            section.setButtonBorderRadius(request.getButtonBorderRadius());
        }
        if (request.getButtonVisible() != null) {
            section.setButtonVisible(request.getButtonVisible());
        }
        section.setButtonHoverBackground(request.getButtonHoverBackground());
        section.setSecondaryButton1Text(request.getSecondaryButton1Text());
        section.setSecondaryButton1Url(request.getSecondaryButton1Url());
        section.setSecondaryButton1Color(request.getSecondaryButton1Color());
        if (request.getSecondaryButton1Visible() != null) {
            section.setSecondaryButton1Visible(request.getSecondaryButton1Visible());
        }
        section.setSecondaryButton2Text(request.getSecondaryButton2Text());
        section.setSecondaryButton2Url(request.getSecondaryButton2Url());
        section.setSecondaryButton2Color(request.getSecondaryButton2Color());
        if (request.getSecondaryButton2Visible() != null) {
            section.setSecondaryButton2Visible(request.getSecondaryButton2Visible());
        }
        if (request.getHeroImageUrl() != null) {
            section.setHeroImageUrl(request.getHeroImageUrl());
        }
        if (request.getLogoImageUrl() != null) {
            section.setLogoImageUrl(blankToNull(request.getLogoImageUrl()));
        }
        if (request.getBackgroundType() != null) {
            section.setBackgroundType(request.getBackgroundType());
        }
        section.setBackgroundColor(request.getBackgroundColor());
        section.setBackgroundGradient(request.getBackgroundGradient());
        section.setBackgroundImageUrl(request.getBackgroundImageUrl());
        section.setOverlayColor(request.getOverlayColor());
        if (request.getOverlayOpacity() != null) {
            section.setOverlayOpacity(request.getOverlayOpacity());
        }
        if (request.getTextAlignment() != null) {
            section.setTextAlignment(request.getTextAlignment());
        }
        if (request.getHeroHeight() != null) {
            section.setHeroHeight(request.getHeroHeight());
        }
        if (request.getImagePosition() != null) {
            section.setImagePosition(request.getImagePosition());
        }
    }

    private void replaceFeatures(HeroSection section, List<HeroFeatureRequest> requests) {
        section.getFeatures().clear();
        int order = 0;
        for (HeroFeatureRequest req : requests) {
            int displayOrder = req.getDisplayOrder() != null ? req.getDisplayOrder() : order;
            section.getFeatures().add(buildFeature(section, req.getIcon(), req.getTitle(), displayOrder));
            order++;
        }
    }

    private HeroFeature buildFeature(HeroSection section, String icon, String title, int displayOrder) {
        return HeroFeature.builder()
                .heroSection(section)
                .icon(icon != null ? icon : "heart")
                .title(title)
                .displayOrder(displayOrder)
                .build();
    }

    private void deleteStoredUpload(String url) {
        if (url != null && url.startsWith("/uploads/")) {
            fileStorageService.deleteIfExists(url);
        }
    }

    private static String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value;
    }

    private HeroSectionResponse defaultResponse() {
        return HeroSectionResponse.builder()
                .id(null)
                .active(true)
                .titleLine1("Vestidos que contam")
                .titleLine2("histórias")
                .titleLine2Color("#9B8FD9")
                .titleFontWeight("bold")
                .titleFontSize("md")
                .description("Descubra peças exclusivas da GIG, criadas com elegância para mulheres especiais.")
                .buttonText("Conheça a coleção")
                .buttonLink("#colecao")
                .buttonBackground("#E8A8B8")
                .buttonTextColor("#2B2B2B")
                .buttonBorderRadius("full")
                .buttonVisible(true)
                .buttonHoverBackground("#E0A4AE")
                .secondaryButton1Visible(false)
                .secondaryButton2Visible(false)
                .heroImageUrl(DEFAULT_HERO_IMAGE)
                .backgroundType("gradient")
                .backgroundGradient("from-[#F7E6EA] via-[#FBF3F5] to-[#F3DDE3]")
                .overlayOpacity(BigDecimal.ZERO)
                .textAlignment("center")
                .heroHeight("medium")
                .imagePosition("right")
                .features(List.of(
                        HeroFeatureResponse.builder().icon("dress").title("Peças exclusivas").displayOrder(0).build(),
                        HeroFeatureResponse.builder().icon("heart").title("Feito para você").displayOrder(1).build(),
                        HeroFeatureResponse.builder().icon("sparkle").title("Elegância em cada detalhe").displayOrder(2).build()
                ))
                .build();
    }

    private HeroSectionResponse toResponse(HeroSection section) {
        List<HeroFeatureResponse> features = section.getFeatures().stream()
                .sorted(Comparator.comparingInt(HeroFeature::getDisplayOrder).thenComparing(HeroFeature::getId))
                .map(this::toFeatureResponse)
                .toList();

        return HeroSectionResponse.builder()
                .id(section.getId())
                .active(section.isActive())
                .titleLine1(section.getTitleLine1())
                .titleLine2(section.getTitleLine2())
                .titleLine2Color(section.getTitleLine2Color())
                .titleFontWeight(section.getTitleFontWeight())
                .titleFontSize(section.getTitleFontSize())
                .description(section.getDescription())
                .buttonText(section.getButtonText())
                .buttonLink(section.getButtonLink())
                .buttonBackground(section.getButtonBackground())
                .buttonTextColor(section.getButtonTextColor())
                .buttonBorderRadius(section.getButtonBorderRadius())
                .buttonVisible(section.isButtonVisible())
                .buttonHoverBackground(section.getButtonHoverBackground())
                .secondaryButton1Text(section.getSecondaryButton1Text())
                .secondaryButton1Url(section.getSecondaryButton1Url())
                .secondaryButton1Color(section.getSecondaryButton1Color())
                .secondaryButton1Visible(section.isSecondaryButton1Visible())
                .secondaryButton2Text(section.getSecondaryButton2Text())
                .secondaryButton2Url(section.getSecondaryButton2Url())
                .secondaryButton2Color(section.getSecondaryButton2Color())
                .secondaryButton2Visible(section.isSecondaryButton2Visible())
                .heroImageUrl(section.getHeroImageUrl())
                .logoImageUrl(section.getLogoImageUrl())
                .backgroundType(section.getBackgroundType())
                .backgroundColor(section.getBackgroundColor())
                .backgroundGradient(section.getBackgroundGradient())
                .backgroundImageUrl(section.getBackgroundImageUrl())
                .overlayColor(section.getOverlayColor())
                .overlayOpacity(section.getOverlayOpacity())
                .textAlignment(section.getTextAlignment())
                .heroHeight(section.getHeroHeight())
                .imagePosition(section.getImagePosition())
                .features(features)
                .createdAt(section.getCreatedAt())
                .updatedAt(section.getUpdatedAt())
                .build();
    }

    private HeroFeatureResponse toFeatureResponse(HeroFeature feature) {
        return HeroFeatureResponse.builder()
                .id(feature.getId())
                .icon(feature.getIcon())
                .title(feature.getTitle())
                .displayOrder(feature.getDisplayOrder())
                .build();
    }
}
