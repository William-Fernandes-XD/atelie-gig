package com.ateliegg.repository;

import com.ateliegg.domain.entity.PaymentTransaction;
import com.ateliegg.domain.enums.PaymentTransactionStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, Long> {

    List<PaymentTransaction> findByOrderIdOrderByCreatedAtDesc(Long orderId);

    Optional<PaymentTransaction> findFirstByOrderIdAndStatusOrderByCreatedAtDesc(
            Long orderId, PaymentTransactionStatus status);

    Optional<PaymentTransaction> findByMercadopagoPaymentId(String mercadopagoPaymentId);
}
