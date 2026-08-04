package com.ateliegg.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "hero_sections")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HeroSection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;

    @Column(name = "title_line1", nullable = false, length = 200)
    private String titleLine1;

    @Column(name = "title_line2", length = 200)
    private String titleLine2;

    @Column(name = "title_line2_color", length = 40)
    private String titleLine2Color;

    @Column(name = "title_font_weight", nullable = false, length = 40)
    @Builder.Default
    private String titleFontWeight = "bold";

    @Column(name = "title_font_size", nullable = false, length = 40)
    @Builder.Default
    private String titleFontSize = "md";

    @Column(length = 1000)
    private String description;

    @Column(name = "button_text", length = 120)
    private String buttonText;

    @Column(name = "button_link", length = 500)
    private String buttonLink;

    @Column(name = "button_background", length = 40)
    private String buttonBackground;

    @Column(name = "button_text_color", length = 40)
    private String buttonTextColor;

    @Column(name = "button_border_radius", nullable = false, length = 40)
    @Builder.Default
    private String buttonBorderRadius = "full";

    @Column(name = "button_visible", nullable = false)
    @Builder.Default
    private boolean buttonVisible = true;

    @Column(name = "button_hover_background", length = 40)
    private String buttonHoverBackground;

    @Column(name = "secondary_button1_text", length = 120)
    private String secondaryButton1Text;

    @Column(name = "secondary_button1_url", length = 500)
    private String secondaryButton1Url;

    @Column(name = "secondary_button1_color", length = 40)
    private String secondaryButton1Color;

    @Column(name = "secondary_button1_visible", nullable = false)
    @Builder.Default
    private boolean secondaryButton1Visible = false;

    @Column(name = "secondary_button2_text", length = 120)
    private String secondaryButton2Text;

    @Column(name = "secondary_button2_url", length = 500)
    private String secondaryButton2Url;

    @Column(name = "secondary_button2_color", length = 40)
    private String secondaryButton2Color;

    @Column(name = "secondary_button2_visible", nullable = false)
    @Builder.Default
    private boolean secondaryButton2Visible = false;

    @Column(name = "hero_image_url", length = 500)
    private String heroImageUrl;

    @Column(name = "logo_image_url", length = 500)
    private String logoImageUrl;

    @Column(name = "background_type", nullable = false, length = 40)
    @Builder.Default
    private String backgroundType = "gradient";

    @Column(name = "background_color", length = 40)
    private String backgroundColor;

    @Column(name = "background_gradient", length = 500)
    private String backgroundGradient;

    @Column(name = "background_image_url", length = 500)
    private String backgroundImageUrl;

    @Column(name = "overlay_color", length = 40)
    private String overlayColor;

    @Column(name = "overlay_opacity", nullable = false, precision = 4, scale = 3)
    @Builder.Default
    private BigDecimal overlayOpacity = BigDecimal.ZERO;

    @Column(name = "text_alignment", nullable = false, length = 20)
    @Builder.Default
    private String textAlignment = "center";

    @Column(name = "hero_height", nullable = false, length = 20)
    @Builder.Default
    private String heroHeight = "medium";

    @Column(name = "image_position", nullable = false, length = 20)
    @Builder.Default
    private String imagePosition = "right";

    @OneToMany(mappedBy = "heroSection", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("displayOrder ASC, id ASC")
    @Builder.Default
    private List<HeroFeature> features = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
