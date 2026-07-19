package com.ateliegg.repository;

import com.ateliegg.domain.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {

    Page<Product> findByActiveTrue(Pageable pageable);

    Page<Product> findByActiveTrueAndCategoryId(Long categoryId, Pageable pageable);

    Page<Product> findByActiveTrueAndTitleContainingIgnoreCase(String title, Pageable pageable);

    Page<Product> findByActiveTrueAndCategoryIdAndTitleContainingIgnoreCase(
            Long categoryId, String title, Pageable pageable);

    List<Product> findByCategoryId(Long categoryId);

    @Query("""
        SELECT DISTINCT p.category FROM Product p
        WHERE p.active = true
        ORDER BY p.category.name
        """)
    List<com.ateliegg.domain.entity.Category> findDistinctActiveCategories();

    @Query(
            value = """
                SELECT DISTINCT p FROM Product p
                LEFT JOIN p.colors col
                LEFT JOIN p.sizes sz
                WHERE p.active = true
                AND (:search = '' OR LOWER(p.title) LIKE LOWER(CONCAT('%', :search, '%')))
                AND (:categoryIds IS NULL OR p.category.id IN :categoryIds)
                AND (:colorNames IS NULL OR col.name IN :colorNames)
                AND (:sizeNames IS NULL OR sz.name IN :sizeNames)
                AND (:minPrice IS NULL OR p.price >= :minPrice)
                AND (:maxPrice IS NULL OR p.price <= :maxPrice)
                """,
            countQuery = """
                SELECT COUNT(DISTINCT p.id) FROM Product p
                LEFT JOIN p.colors col
                LEFT JOIN p.sizes sz
                WHERE p.active = true
                AND (:search = '' OR LOWER(p.title) LIKE LOWER(CONCAT('%', :search, '%')))
                AND (:categoryIds IS NULL OR p.category.id IN :categoryIds)
                AND (:colorNames IS NULL OR col.name IN :colorNames)
                AND (:sizeNames IS NULL OR sz.name IN :sizeNames)
                AND (:minPrice IS NULL OR p.price >= :minPrice)
                AND (:maxPrice IS NULL OR p.price <= :maxPrice)
                """
    )
    Page<Product> findActiveFiltered(
            @Param("search") String search,
            @Param("categoryIds") List<Long> categoryIds,
            @Param("colorNames") List<String> colorNames,
            @Param("sizeNames") List<String> sizeNames,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            Pageable pageable);

    @Query("""
        SELECT MIN(p.price), MAX(p.price) FROM Product p
        WHERE p.active = true
        AND (:categoryId = -1 OR p.category.id = :categoryId)
        """)
    List<Object[]> findActivePriceRange(@Param("categoryId") Long categoryId);
}
