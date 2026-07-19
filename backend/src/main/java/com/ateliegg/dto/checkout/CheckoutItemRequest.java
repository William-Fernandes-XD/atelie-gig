package com.ateliegg.dto.checkout;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CheckoutItemRequest {
    @NotNull
    private Long productId;
    @NotBlank
    private String colorName;
    @NotBlank
    private String sizeName;
    @NotNull @Min(1)
    private Integer quantity;
}
