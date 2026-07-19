package com.ateliegg.repository;

import com.ateliegg.domain.entity.ProductColor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProductColorRepository extends JpaRepository<ProductColor, Long> {

    @Query("""
        SELECT DISTINCT c.name FROM ProductColor c
        JOIN c.product p
        WHERE p.active = true
        AND (:categoryId = -1 OR p.category.id = :categoryId)
        ORDER BY c.name
        """)
    List<String> findDistinctNamesByActiveProducts(@Param("categoryId") Long categoryId);
}
