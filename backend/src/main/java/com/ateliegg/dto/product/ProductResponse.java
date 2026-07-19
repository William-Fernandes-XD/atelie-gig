package com.ateliegg.dto.product;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
public class ProductResponse {
    private Long id;
    private String title;
    private String description;
    private Long categoryId;
    private String categoryName;
    private BigDecimal price;
    private BigDecimal wholesalePrice;
    private String mainImageUrl;
    private Boolean active;
    private List<ColorResponse> colors;
    private List<String> sizes;
    private List<Map<String, String>> specifications;
    private List<String> galleryImages;
    private List<StockResponse> stock;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data
    @Builder
    public static class ColorResponse {
        private Long id;
        private String name;
        private String hexCode;
    }

    @Data
    @Builder
    public static class StockResponse {
        private Long id;
        private Long colorId;
        private String colorName;
        private Long sizeId;
        private String sizeName;
        private Integer quantity;
    }
}
