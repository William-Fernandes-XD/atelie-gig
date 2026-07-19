package com.ateliegg.service;

import com.ateliegg.domain.entity.Order;
import com.ateliegg.domain.entity.OrderStatusHistory;
import com.ateliegg.domain.enums.OrderStatus;
import org.springframework.stereotype.Service;

@Service
public class OrderStatusHistoryService {

    public void record(Order order, OrderStatus status, String observation, String createdBy) {
        String note = (observation == null || observation.isBlank())
                ? defaultObservation(status)
                : observation.trim();

        OrderStatusHistory entry = OrderStatusHistory.builder()
                .order(order)
                .status(status)
                .observation(note)
                .createdBy(createdBy != null ? createdBy : "sistema")
                .build();

        order.getStatusHistory().add(entry);
    }

    public String defaultObservation(OrderStatus status) {
        return switch (status) {
            case PENDING_PAYMENT -> "Pedido criado. Aguardando confirmação do pagamento.";
            case PAID -> "Pagamento confirmado. Seu pedido será preparado em breve.";
            case PROCESSING -> "Estamos preparando o seu pedido com carinho.";
            case SHIPPED -> "Seu pedido saiu para entrega.";
            case DELIVERED -> "Pedido entregue. Obrigada pela preferência!";
            case CANCELLED -> "Pedido cancelado.";
            case REFUNDED -> "Pedido reembolsado.";
        };
    }
}
