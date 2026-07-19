package com.ateliegg.dto.order;

import com.ateliegg.domain.enums.OrderStatus;
import com.ateliegg.domain.enums.PaymentMethod;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class OrderResponse {
    private Long id;
    private String orderNumber;
    private OrderStatus status;
    private BigDecimal subtotal;
    private BigDecimal shippingCost;
    private String shippingServiceName;
    private Integer shippingDeadlineDays;
    private BigDecimal total;
    private Boolean wholesaleApplied;
    private PaymentMethod paymentMethod;
    private LocalDateTime paymentExpiresAt;
    private Boolean canPay;
    /** True quando falta CPF válido e a tela de pagamento deve pedir o campo. */
    private Boolean requiresCpf;
    private String customerName;
    private String customerEmail;
    private String customerPhone;
    private String customerCpf;
    private List<OrderItemResponse> items;
    private ShippingInfo shipping;
    private List<StatusHistoryEntry> statusHistory;
    private LocalDateTime createdAt;

    @Data
    @Builder
    public static class OrderItemResponse {
        private Long productId;
        private String productTitle;
        private String productImageUrl;
        private Long categoryId;
        private String categoryName;
        private String colorName;
        private String sizeName;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal totalPrice;
    }

    @Data
    @Builder
    public static class ShippingInfo {
        private String cep;
        private String street;
        private String number;
        private String neighborhood;
        private String city;
        private String state;
        private String complement;
        private String reference;
        private BigDecimal cost;
        private String serviceCode;
        private String serviceName;
        private Integer deadlineDays;
    }

    @Data
    @Builder
    public static class StatusHistoryEntry {
        private Long id;
        private OrderStatus status;
        private String observation;
        private String createdBy;
        private LocalDateTime createdAt;
    }
}
