package com.ateliegg.domain.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "product_colors", uniqueConstraints = @UniqueConstraint(columnNames = {"product_id", "name"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductColor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(name = "hex_code", length = 7)
    private String hexCode;
}
