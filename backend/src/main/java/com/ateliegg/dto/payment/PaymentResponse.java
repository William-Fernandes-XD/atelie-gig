package com.ateliegg.dto.payment;

import com.ateliegg.domain.enums.PaymentMethod;
import com.ateliegg.domain.enums.PaymentTransactionStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class PaymentResponse {
    private Long transactionId;
    private Long orderId;
    private String orderNumber;
    private PaymentMethod method;
    private PaymentTransactionStatus status;
    private String statusDetail;
    private BigDecimal amount;
    private String mercadopagoPaymentId;
    private String pixQrCode;
    private String pixQrCodeBase64;
    private LocalDateTime pixExpiration;
    private boolean orderPaid;
}
