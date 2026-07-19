package com.ateliegg.domain.entity;

import com.ateliegg.domain.enums.OrderStatus;
import com.ateliegg.domain.enums.PaymentMethod;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_number", nullable = false, unique = true, length = 40)
    private String orderNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "guest_name", length = 150)
    private String guestName;

    @Column(name = "guest_email", length = 150)
    private String guestEmail;

    @Column(name = "guest_phone", length = 20)
    private String guestPhone;

    @Column(name = "guest_cpf", length = 14)
    private String guestCpf;

    @Column(name = "shipping_cep", nullable = false, length = 9)
    private String shippingCep;

    @Column(name = "shipping_street", nullable = false, length = 200)
    private String shippingStreet;

    @Column(name = "shipping_number", nullable = false, length = 20)
    private String shippingNumber;

    @Column(name = "shipping_neighborhood", nullable = false, length = 100)
    private String shippingNeighborhood;

    @Column(name = "shipping_city", nullable = false, length = 100)
    private String shippingCity;

    @Column(name = "shipping_state", nullable = false, length = 2)
    private String shippingState;

    @Column(name = "shipping_complement", length = 200)
    private String shippingComplement;

    @Column(name = "shipping_reference", length = 200)
    private String shippingReference;

    @Column(name = "shipping_cost", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal shippingCost = BigDecimal.ZERO;

    @Column(name = "shipping_service_code", length = 20)
    private String shippingServiceCode;

    @Column(name = "shipping_service_name", length = 80)
    private String shippingServiceName;

    @Column(name = "shipping_deadline_days")
    private Integer shippingDeadlineDays;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private OrderStatus status = OrderStatus.PENDING_PAYMENT;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal subtotal;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal total;

    @Column(name = "wholesale_applied", nullable = false)
    @Builder.Default
    private Boolean wholesaleApplied = false;

    @Column(name = "mercadopago_preference_id", length = 100)
    private String mercadopagoPreferenceId;

    @Column(name = "mercadopago_payment_id", length = 100)
    private String mercadopagoPaymentId;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", length = 20)
    private PaymentMethod paymentMethod;

    @Column(name = "payment_expires_at")
    private LocalDateTime paymentExpiresAt;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<PaymentTransaction> paymentTransactions = new ArrayList<>();

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<OrderItem> items = new ArrayList<>();

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt ASC")
    @Builder.Default
    private List<OrderStatusHistory> statusHistory = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
