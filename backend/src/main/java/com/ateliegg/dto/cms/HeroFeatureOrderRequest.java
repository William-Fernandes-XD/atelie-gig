package com.ateliegg.dto.cms;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class HeroFeatureOrderRequest {

    @NotNull
    private List<Long> featureIds;
}
