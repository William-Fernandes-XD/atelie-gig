package com.ateliegg.dto.shipping;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class ShippingQuoteRequest {

    @NotBlank
    private String destinationCep;

    @NotEmpty
    @Valid
    private List<QuoteItem> items;

    @Data
    public static class QuoteItem {
        @NotNull
        private Long productId;

        @NotNull
        @Min(1)
        private Integer quantity;
    }
}
