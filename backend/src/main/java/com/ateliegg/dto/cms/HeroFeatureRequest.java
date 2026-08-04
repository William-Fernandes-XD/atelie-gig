package com.ateliegg.dto.cms;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class HeroFeatureRequest {

    private Long id;

    @NotBlank
    @Size(max = 40)
    private String icon;

    @NotBlank
    @Size(max = 120)
    private String title;

    private Integer displayOrder;
}
