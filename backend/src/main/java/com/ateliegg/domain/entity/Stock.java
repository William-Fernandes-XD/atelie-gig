package com.ateliegg.domain.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "stock", uniqueConstraints = @UniqueConstraint(columnNames = {"product_id", "color_id", "size_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Stock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "color_id", nullable = false)
    private ProductColor color;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "size_id", nullable = false)
    private ProductSize size;

    @Column(nullable = false)
    @Builder.Default
    private Integer quantity = 0;
}
