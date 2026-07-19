package com.ateliegg.dto.product;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class ProductFilterOptionsResponse {

    private List<CategoryOption> categories;
    private List<String> colors;
    private List<String> sizes;
    private BigDecimal minPrice;
    private BigDecimal maxPrice;

    @Data
    @Builder
    public static class CategoryOption {
        private Long id;
        private String name;
    }
}
