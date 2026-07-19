package com.ateliegg.dto.checkout;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class CheckoutResponse {
    private Long orderId;
    private String orderNumber;
    private BigDecimal subtotal;
    private BigDecimal shippingCost;
    private String shippingServiceName;
    private Integer shippingDeadlineDays;
    private BigDecimal total;
    private Boolean wholesaleApplied;
}
