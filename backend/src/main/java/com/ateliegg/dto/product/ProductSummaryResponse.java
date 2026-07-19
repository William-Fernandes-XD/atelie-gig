package com.ateliegg.dto.product;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class ProductSummaryResponse {
    private Long id;
    private String title;
    private BigDecimal price;
    private BigDecimal wholesalePrice;
    private String mainImageUrl;
    private String categoryName;
}
