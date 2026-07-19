package com.ateliegg.domain.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "product_sizes", uniqueConstraints = @UniqueConstraint(columnNames = {"product_id", "name"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductSize {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false, length = 20)
    private String name;
}
