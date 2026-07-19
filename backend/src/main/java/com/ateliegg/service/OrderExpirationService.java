package com.ateliegg.service;

import com.ateliegg.domain.entity.*;
import com.ateliegg.domain.enums.OrderStatus;
import com.ateliegg.repository.OrderRepository;
import com.ateliegg.repository.StockRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderExpirationService {

    private final OrderRepository orderRepository;
    private final StockRepository stockRepository;
    private final OrderStatusHistoryService orderStatusHistoryService;
    private final PaymentService paymentService;

    @Transactional
    public int cancelExpiredPendingOrders() {
        List<Order> expiredOrders = orderRepository.findExpiredPendingPayments(LocalDateTime.now());
        List<Order> toSave = new ArrayList<>();

        for (Order order : expiredOrders) {
            boolean paymentsCancelled;
            try {
                paymentsCancelled = paymentService.cancelPendingPaymentsForExpiration(order);
            } catch (Exception ex) {
                log.error("Erro ao cancelar pagamentos MP do pedido {}: {}",
                        order.getOrderNumber(), ex.getMessage());
                paymentsCancelled = true;
            }

            // Pagamento já aprovado no MP: pedido foi marcado como PAID — não cancela
            if (!paymentsCancelled || order.getStatus() == OrderStatus.PAID) {
                log.info("Pedido {} expirado no prazo, mas já pago no Mercado Pago — mantido como pago",
                        order.getOrderNumber());
                toSave.add(order);
                continue;
            }

            restoreStock(order);
            order.setStatus(OrderStatus.CANCELLED);
            orderStatusHistoryService.record(
                    order,
                    OrderStatus.CANCELLED,
                    "Pedido cancelado automaticamente por expiração do prazo de pagamento (24h). Pagamento cancelado no Mercado Pago.",
                    "sistema");
            toSave.add(order);
            log.info("Pedido {} cancelado por expiração de pagamento (24h) + Mercado Pago",
                    order.getOrderNumber());
        }

        if (!toSave.isEmpty()) {
            orderRepository.saveAll(toSave);
        }

        return (int) toSave.stream().filter(o -> o.getStatus() == OrderStatus.CANCELLED).count();
    }

    public void restoreStock(Order order) {
        for (OrderItem item : order.getItems()) {
            Product product = item.getProduct();

            ProductColor color = product.getColors().stream()
                    .filter(c -> c.getName().equalsIgnoreCase(item.getColorName()))
                    .findFirst()
                    .orElse(null);

            ProductSize size = product.getSizes().stream()
                    .filter(s -> s.getName().equalsIgnoreCase(item.getSizeName()))
                    .findFirst()
                    .orElse(null);

            if (color == null || size == null) {
                log.warn("Não foi possível restaurar estoque do item {} do pedido {}",
                        item.getProductTitle(), order.getOrderNumber());
                continue;
            }

            stockRepository.findByProductIdAndColorIdAndSizeId(product.getId(), color.getId(), size.getId())
                    .ifPresent(stock -> {
                        stock.setQuantity(stock.getQuantity() + item.getQuantity());
                        stockRepository.save(stock);
                    });
        }
    }
}
