package com.ateliegg.dto.payment;

import lombok.Data;

@Data
public class PixPaymentRequest {
    /** CPF informado na tela de pagamento quando o usuário ainda não tem cadastrado. */
    private String payerCpf;
}
