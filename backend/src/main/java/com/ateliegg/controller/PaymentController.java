package com.ateliegg.controller;

import com.ateliegg.dto.payment.CardPaymentRequest;
import com.ateliegg.dto.payment.PaymentConfigResponse;
import com.ateliegg.dto.payment.PaymentResponse;
import com.ateliegg.dto.payment.PixPaymentRequest;
import com.ateliegg.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@Tag(name = "Pagamentos")
public class PaymentController {

    private final PaymentService paymentService;

    @GetMapping("/api/payments/config")
    @Operation(summary = "Chave pública do Mercado Pago para pagamento no site")
    public PaymentConfigResponse getConfig() {
        return paymentService.getConfig();
    }

    @PostMapping("/api/orders/{orderId}/pay/pix")
    @Operation(summary = "Gerar pagamento PIX para um pedido")
    public PaymentResponse payWithPix(
            @PathVariable Long orderId,
            @RequestBody(required = false) PixPaymentRequest request) {
        return paymentService.createPixPayment(orderId, request);
    }

    @PostMapping("/api/orders/{orderId}/pay/card")
    @Operation(summary = "Pagar pedido com cartão de crédito")
    public PaymentResponse payWithCard(
            @PathVariable Long orderId,
            @Valid @RequestBody CardPaymentRequest request) {
        return paymentService.createCardPayment(orderId, request);
    }

    @GetMapping("/api/orders/{orderId}/payment-status")
    @Operation(summary = "Consultar status do pagamento de um pedido")
    public PaymentResponse getPaymentStatus(@PathVariable Long orderId) {
        return paymentService.syncOrderPayment(orderId);
    }
}
