package com.ateliegg.dto.cms;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class HeroSectionRequest {

    @NotBlank
    @Size(max = 200)
    private String titleLine1;

    @Size(max = 200)
    private String titleLine2;

    @Size(max = 40)
    private String titleLine2Color;

    @Size(max = 40)
    private String titleFontWeight;

    @Size(max = 40)
    private String titleFontSize;

    @Size(max = 1000)
    private String description;

    @Size(max = 120)
    private String buttonText;

    @Size(max = 500)
    private String buttonLink;

    @Size(max = 40)
    private String buttonBackground;

    @Size(max = 40)
    private String buttonTextColor;

    @Size(max = 40)
    private String buttonBorderRadius;

    private Boolean buttonVisible;

    @Size(max = 40)
    private String buttonHoverBackground;

    @Size(max = 120)
    private String secondaryButton1Text;

    @Size(max = 500)
    private String secondaryButton1Url;

    @Size(max = 40)
    private String secondaryButton1Color;

    private Boolean secondaryButton1Visible;

    @Size(max = 120)
    private String secondaryButton2Text;

    @Size(max = 500)
    private String secondaryButton2Url;

    @Size(max = 40)
    private String secondaryButton2Color;

    private Boolean secondaryButton2Visible;

    @Size(max = 500)
    private String heroImageUrl;

    @Size(max = 500)
    private String logoImageUrl;

    @Size(max = 40)
    private String backgroundType;

    @Size(max = 40)
    private String backgroundColor;

    @Size(max = 500)
    private String backgroundGradient;

    @Size(max = 500)
    private String backgroundImageUrl;

    @Size(max = 40)
    private String overlayColor;

    private BigDecimal overlayOpacity;

    @Size(max = 20)
    private String textAlignment;

    @Size(max = 20)
    private String heroHeight;

    @Size(max = 20)
    private String imagePosition;

    @Valid
    private List<HeroFeatureRequest> features;
}
