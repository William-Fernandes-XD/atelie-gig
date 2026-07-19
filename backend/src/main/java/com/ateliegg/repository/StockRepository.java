package com.ateliegg.repository;

import com.ateliegg.domain.entity.Stock;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface StockRepository extends JpaRepository<Stock, Long> {

    Optional<Stock> findByProductIdAndColorIdAndSizeId(Long productId, Long colorId, Long sizeId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        SELECT s FROM Stock s
        WHERE s.product.id = :productId AND s.color.id = :colorId AND s.size.id = :sizeId
        """)
    Optional<Stock> findByProductIdAndColorIdAndSizeIdForUpdate(
            @Param("productId") Long productId,
            @Param("colorId") Long colorId,
            @Param("sizeId") Long sizeId);

    List<Stock> findByProductId(Long productId);

    @Query("""
        SELECT s FROM Stock s
        JOIN FETCH s.product p
        JOIN FETCH s.color
        JOIN FETCH s.size
        WHERE s.quantity = 0 AND p.active = true
        """)
    List<Stock> findOutOfStockItems();
}
