package com.ateliegg.config;

import com.ateliegg.service.OrderExpirationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class ScheduledTasksConfig {

    private final OrderExpirationService orderExpirationService;

    @Scheduled(fixedRate = 30 * 60 * 1000)
    public void cancelExpiredPayments() {
        int cancelled = orderExpirationService.cancelExpiredPendingOrders();
        if (cancelled > 0) {
            log.info("Rotina automática: {} pedido(s) pendente(s) cancelado(s) por expiração de 24h", cancelled);
        }
    }
}
