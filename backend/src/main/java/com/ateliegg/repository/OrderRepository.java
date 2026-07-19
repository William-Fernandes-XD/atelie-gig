package com.ateliegg.repository;

import com.ateliegg.domain.entity.Order;
import com.ateliegg.domain.enums.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {

    Optional<Order> findByOrderNumber(String orderNumber);

    Page<Order> findByUserId(Long userId, Pageable pageable);

    List<Order> findByStatus(OrderStatus status);

    Optional<Order> findFirstByUserIdAndStatusAndCreatedAtAfterOrderByCreatedAtDesc(
            Long userId, OrderStatus status, LocalDateTime createdAfter);

    @Query("""
        SELECT DISTINCT o FROM Order o
        LEFT JOIN FETCH o.items
        WHERE o.id = :id
        """)
    Optional<Order> findByIdWithItems(@Param("id") Long id);

    @Query("SELECT COALESCE(SUM(o.total), 0) FROM Order o WHERE o.status IN ('PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED')")
    BigDecimal calculateTotalRevenue();

    @Query("""
        SELECT COALESCE(SUM(o.total), 0) FROM Order o
        WHERE o.status IN ('PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED')
        AND o.createdAt >= :startDate AND o.createdAt < :endDate
        """)
    BigDecimal calculateTotalRevenueBetween(LocalDateTime startDate, LocalDateTime endDate);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.status IN ('PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED')")
    long countPaidOrders();

    @Query("""
        SELECT COUNT(o) FROM Order o
        WHERE o.status IN ('PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED')
        AND o.createdAt >= :startDate AND o.createdAt < :endDate
        """)
    long countPaidOrdersBetween(LocalDateTime startDate, LocalDateTime endDate);

    @Query("""
        SELECT o FROM Order o
        LEFT JOIN FETCH o.user
        WHERE o.status IN ('PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED')
        AND o.createdAt >= :startDate AND o.createdAt < :endDate
        ORDER BY o.createdAt DESC
        """)
    List<Order> findRecentSalesBetween(LocalDateTime startDate, LocalDateTime endDate, Pageable pageable);

    @Query("""
        SELECT oi.productTitle, SUM(oi.quantity) as totalQty
        FROM OrderItem oi
        JOIN oi.order o
        WHERE o.status IN ('PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED')
        AND o.createdAt >= :startDate AND o.createdAt < :endDate
        GROUP BY oi.productTitle
        ORDER BY totalQty DESC
        """)
    List<Object[]> findTopSellingProductsBetween(LocalDateTime startDate, LocalDateTime endDate, Pageable pageable);

    @Query("""
        SELECT p.category.name, SUM(oi.quantity) as totalQty
        FROM OrderItem oi
        JOIN oi.order o
        JOIN oi.product p
        WHERE o.status IN ('PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED')
        AND o.createdAt >= :startDate AND o.createdAt < :endDate
        GROUP BY p.category.name
        ORDER BY totalQty DESC
        """)
    List<Object[]> findTopCategoriesBetween(LocalDateTime startDate, LocalDateTime endDate, Pageable pageable);

    @Query("""
        SELECT COALESCE(u.name, o.guestName, o.guestEmail), COUNT(o), SUM(o.total)
        FROM Order o
        LEFT JOIN o.user u
        WHERE o.status IN ('PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED')
        AND o.createdAt >= :startDate AND o.createdAt < :endDate
        GROUP BY COALESCE(u.id, 0), COALESCE(u.name, o.guestName, o.guestEmail), COALESCE(u.email, o.guestEmail)
        ORDER BY SUM(o.total) DESC
        """)
    List<Object[]> findTopBuyersBetween(LocalDateTime startDate, LocalDateTime endDate, Pageable pageable);

    @Query(value = """
        SELECT TO_CHAR(o.created_at, 'YYYY-MM') AS month, COALESCE(SUM(o.total), 0)
        FROM orders o
        WHERE o.status IN ('PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED')
        AND o.created_at >= :startDate
        GROUP BY TO_CHAR(o.created_at, 'YYYY-MM')
        ORDER BY month
        """, nativeQuery = true)
    List<Object[]> findMonthlyRevenueSince(LocalDateTime startDate);

    long countByCreatedAtAfter(LocalDateTime date);

    @Query("""
        SELECT o FROM Order o
        WHERE o.status = 'PENDING_PAYMENT'
        AND o.paymentExpiresAt IS NOT NULL
        AND o.paymentExpiresAt < :now
        """)
    List<Order> findExpiredPendingPayments(LocalDateTime now);
}
