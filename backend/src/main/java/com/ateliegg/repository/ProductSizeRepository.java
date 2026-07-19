package com.ateliegg.repository;

import com.ateliegg.domain.entity.ProductSize;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProductSizeRepository extends JpaRepository<ProductSize, Long> {

    @Query("""
        SELECT DISTINCT s.name FROM ProductSize s
        JOIN s.product p
        WHERE p.active = true
        AND (:categoryId = -1 OR p.category.id = :categoryId)
        ORDER BY s.name
        """)
    List<String> findDistinctNamesByActiveProducts(@Param("categoryId") Long categoryId);
}
