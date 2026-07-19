package com.ateliegg.controller;

import com.ateliegg.dto.checkout.CheckoutRequest;
import com.ateliegg.dto.checkout.CheckoutResponse;
import com.ateliegg.service.CheckoutService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/checkout")
@RequiredArgsConstructor
@Tag(name = "Checkout")
public class CheckoutController {

    private final CheckoutService checkoutService;

    @PostMapping
    @Operation(summary = "Finalizar compra e iniciar pagamento Mercado Pago")
    public CheckoutResponse checkout(@Valid @RequestBody CheckoutRequest request) {
        return checkoutService.processCheckout(request);
    }
}
