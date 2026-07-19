package com.ateliegg.dto.payment;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PaymentConfigResponse {
    private String publicKey;
}
