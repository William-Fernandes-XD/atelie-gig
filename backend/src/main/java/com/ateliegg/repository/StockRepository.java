package com.ateliegg.repository;

import com.ateliegg.domain.entity.Stock;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
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

    /**
     * Reserva atômica: só baixa se houver quantidade suficiente.
     * Dois checkouts simultâneos: no máximo um consegue a última unidade.
     * @return 1 se reservou, 0 se estoque insuficiente
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
        UPDATE Stock s
        SET s.quantity = s.quantity - :qty
        WHERE s.product.id = :productId
          AND s.color.id = :colorId
          AND s.size.id = :sizeId
          AND s.quantity >= :qty
        """)
    int tryReserve(
            @Param("productId") Long productId,
            @Param("colorId") Long colorId,
            @Param("sizeId") Long sizeId,
            @Param("qty") int qty);

    /** Devolve unidades ao estoque de forma atômica (cancelamento / expiração). */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
        UPDATE Stock s
        SET s.quantity = s.quantity + :qty
        WHERE s.product.id = :productId
          AND s.color.id = :colorId
          AND s.size.id = :sizeId
        """)
    int release(
            @Param("productId") Long productId,
            @Param("colorId") Long colorId,
            @Param("sizeId") Long sizeId,
            @Param("qty") int qty);

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
