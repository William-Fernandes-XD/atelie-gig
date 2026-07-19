package com.ateliegg.dto.product;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
public class ProductRequest {
    @NotBlank
    private String title;
    private String description;
    @NotNull
    private Long categoryId;
    @NotNull @DecimalMin("0.01")
    private BigDecimal price;
    @NotNull @DecimalMin("0.01")
    private BigDecimal wholesalePrice;
    private Boolean active = true;
    private List<ColorRequest> colors = new ArrayList<>();
    private List<String> sizes = new ArrayList<>();
    private List<SpecificationRequest> specifications = new ArrayList<>();
    private List<StockRequest> stock = new ArrayList<>();

    @Data
    public static class ColorRequest {
        @NotBlank
        private String name;
        private String hexCode;
    }

    @Data
    public static class SpecificationRequest {
        @NotBlank
        private String key;
        @NotBlank
        private String value;
    }

    @Data
    public static class StockRequest {
        @NotBlank
        private String colorName;
        @NotBlank
        private String sizeName;
        @Min(0)
        private Integer quantity;
    }
}
