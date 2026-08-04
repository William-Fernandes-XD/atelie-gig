package com.ateliegg.dto.cms;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class HeroSectionResponse {
    private Long id;
    private boolean active;
    private String titleLine1;
    private String titleLine2;
    private String titleLine2Color;
    private String titleFontWeight;
    private String titleFontSize;
    private String description;
    private String buttonText;
    private String buttonLink;
    private String buttonBackground;
    private String buttonTextColor;
    private String buttonBorderRadius;
    private boolean buttonVisible;
    private String buttonHoverBackground;
    private String secondaryButton1Text;
    private String secondaryButton1Url;
    private String secondaryButton1Color;
    private boolean secondaryButton1Visible;
    private String secondaryButton2Text;
    private String secondaryButton2Url;
    private String secondaryButton2Color;
    private boolean secondaryButton2Visible;
    private String heroImageUrl;
    private String logoImageUrl;
    private String backgroundType;
    private String backgroundColor;
    private String backgroundGradient;
    private String backgroundImageUrl;
    private String overlayColor;
    private BigDecimal overlayOpacity;
    private String textAlignment;
    private String heroHeight;
    private String imagePosition;
    private List<HeroFeatureResponse> features;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
