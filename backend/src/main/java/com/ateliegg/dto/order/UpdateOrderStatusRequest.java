package com.ateliegg.dto.order;

import com.ateliegg.domain.enums.OrderStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateOrderStatusRequest {

    @NotNull
    private OrderStatus status;

    @Size(max = 500)
    private String observation;
}
