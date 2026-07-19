package com.ateliegg.dto.shipping;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class ShippingQuoteResponse {
    private String originCep;
    private String destinationCep;
    private BigDecimal packageWeightKg;
    private List<ShippingOption> options;

    @Data
    @Builder
    public static class ShippingOption {
        private String serviceCode;
        private String serviceName;
        private BigDecimal price;
        private Integer deadlineDays;
        /** true quando veio da API dos Correios; false = estimativa de contingência */
        private boolean fromCorreios;
    }
}
