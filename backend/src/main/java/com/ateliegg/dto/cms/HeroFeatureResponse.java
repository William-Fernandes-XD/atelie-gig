package com.ateliegg.dto.cms;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class HeroFeatureResponse {
    private Long id;
    private String icon;
    private String title;
    private int displayOrder;
}
