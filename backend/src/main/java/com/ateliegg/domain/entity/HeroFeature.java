package com.ateliegg.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "hero_features")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HeroFeature {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "hero_section_id", nullable = false)
    private HeroSection heroSection;

    @Column(nullable = false, length = 40)
    @Builder.Default
    private String icon = "heart";

    @Column(nullable = false, length = 120)
    private String title;

    @Column(name = "display_order", nullable = false)
    @Builder.Default
    private int displayOrder = 0;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
