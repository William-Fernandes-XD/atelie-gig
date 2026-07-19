package com.ateliegg.dto.payment;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CardPaymentRequest {

    @NotBlank
    private String token;

    @NotBlank
    private String paymentMethodId;

    @NotNull
    private Integer installments;

    private String issuerId;

    @NotBlank
    private String payerEmail;

    @NotBlank
    private String payerName;

    @NotBlank
    private String payerCpf;
}
