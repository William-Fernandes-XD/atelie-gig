package com.ateliegg.controller;

import com.ateliegg.dto.shipping.ShippingQuoteRequest;
import com.ateliegg.dto.shipping.ShippingQuoteResponse;
import com.ateliegg.service.CorreiosShippingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/shipping")
@RequiredArgsConstructor
@Tag(name = "Frete")
public class ShippingController {

    private final CorreiosShippingService correiosShippingService;

    @PostMapping("/quote")
    @Operation(summary = "Simular frete PAC/SEDEX (Correios) para o CEP de destino")
    public ShippingQuoteResponse quote(@Valid @RequestBody ShippingQuoteRequest request) {
        return correiosShippingService.quote(request);
    }
}
