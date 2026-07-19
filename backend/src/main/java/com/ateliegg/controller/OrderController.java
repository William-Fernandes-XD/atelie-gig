package com.ateliegg.controller;

import com.ateliegg.dto.order.OrderResponse;
import com.ateliegg.dto.order.UpdateOrderStatusRequest;
import com.ateliegg.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@Tag(name = "Pedidos")
public class OrderController {

    private final OrderService orderService;

    @GetMapping
    @Operation(summary = "Listar todos os pedidos (admin)")
    @SecurityRequirement(name = "Bearer Authentication")
    public Page<OrderResponse> findAll(
            @PageableDefault(size = 25, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return orderService.findAll(pageable);
    }

    @GetMapping("/my")
    @Operation(summary = "Meus pedidos")
    @SecurityRequirement(name = "Bearer Authentication")
    public Page<OrderResponse> findMyOrders(
            @PageableDefault(size = 25, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return orderService.findMyOrders(pageable);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar pedido por ID")
    @SecurityRequirement(name = "Bearer Authentication")
    public OrderResponse findById(@PathVariable Long id) {
        return orderService.findById(id);
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "Cancelar pedido pendente (cliente)")
    @SecurityRequirement(name = "Bearer Authentication")
    public OrderResponse cancelMyOrder(@PathVariable Long id) {
        return orderService.cancelMyOrder(id);
    }

    @GetMapping("/number/{orderNumber}")
    @Operation(summary = "Buscar pedido por número")
    public OrderResponse findByNumber(@PathVariable String orderNumber) {
        return orderService.findByOrderNumber(orderNumber);
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Atualizar status do pedido (admin)")
    @SecurityRequirement(name = "Bearer Authentication")
    public OrderResponse updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateOrderStatusRequest request) {
        return orderService.updateStatus(id, request);
    }

    @PostMapping("/webhook/mercadopago")
    @Operation(summary = "Webhook Mercado Pago")
    public void mercadoPagoWebhook(@RequestBody Map<String, Object> payload) {
        orderService.handleWebhook(payload);
    }
}
