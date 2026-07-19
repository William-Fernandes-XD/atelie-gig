package com.ateliegg.service;

import com.ateliegg.domain.entity.Order;
import com.ateliegg.domain.enums.OrderStatus;
import com.ateliegg.dto.order.OrderResponse;
import com.ateliegg.dto.order.UpdateOrderStatusRequest;
import com.ateliegg.exception.BusinessException;
import com.ateliegg.repository.OrderRepository;
import com.ateliegg.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final SecurityUtils securityUtils;
    private final PaymentService paymentService;
    private final OrderStatusHistoryService orderStatusHistoryService;
    private final OrderExpirationService orderExpirationService;

    @Transactional(readOnly = true)
    public Page<OrderResponse> findAll(Pageable pageable) {
        return orderRepository.findAll(pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<OrderResponse> findMyOrders(Pageable pageable) {
        var user = securityUtils.getCurrentUser();
        return orderRepository.findByUserId(user.getId(), pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public OrderResponse findById(Long id) {
        return toResponse(getOrderWithAccess(id));
    }

    @Transactional(readOnly = true)
    public OrderResponse findByOrderNumber(String orderNumber) {
        return orderRepository.findByOrderNumber(orderNumber)
                .map(this::toResponse)
                .orElseThrow(() -> new BusinessException("Pedido não encontrado", HttpStatus.NOT_FOUND));
    }

    @Transactional
    public OrderResponse cancelMyOrder(Long id) {
        Order order = getOrderWithAccess(id);
        var user = securityUtils.getCurrentUser();

        boolean isOwner = order.getUser() != null && order.getUser().getId().equals(user.getId());
        if (!isOwner) {
            throw new BusinessException("Apenas o dono do pedido pode cancelá-lo", HttpStatus.FORBIDDEN);
        }

        if (order.getStatus() != OrderStatus.PENDING_PAYMENT) {
            throw new BusinessException(
                    "Só é possível cancelar pedidos aguardando pagamento",
                    HttpStatus.BAD_REQUEST);
        }

        paymentService.cancelPendingPayments(order);
        orderExpirationService.restoreStock(order);
        order.setStatus(OrderStatus.CANCELLED);
        orderStatusHistoryService.record(
                order,
                OrderStatus.CANCELLED,
                "Pedido cancelado pelo cliente.",
                user.getName());

        return toResponse(orderRepository.save(order));
    }

    @Transactional
    public OrderResponse updateStatus(Long id, UpdateOrderStatusRequest request) {
        Order order = getOrder(id);
        OrderStatus previousStatus = order.getStatus();
        OrderStatus newStatus = request.getStatus();

        if (previousStatus != newStatus) {
            if (newStatus == OrderStatus.CANCELLED) {
                applyAdminCancellation(order, previousStatus);
            }

            order.setStatus(newStatus);
            String createdBy = securityUtils.isAuthenticated()
                    ? securityUtils.getCurrentUser().getName()
                    : "admin";
            String observation = request.getObservation();
            if ((observation == null || observation.isBlank()) && newStatus == OrderStatus.CANCELLED) {
                observation = "Pedido cancelado pelo administrador. Pagamento cancelado no Mercado Pago, se houver.";
            }
            orderStatusHistoryService.record(order, newStatus, observation, createdBy);
        } else if (request.getObservation() != null && !request.getObservation().isBlank()) {
            orderStatusHistoryService.record(
                    order,
                    newStatus,
                    request.getObservation(),
                    securityUtils.getCurrentUser().getName());
        }

        return toResponse(orderRepository.save(order));
    }

    /**
     * Cancelamento pelo admin: sempre cancela pagamentos pendentes no Mercado Pago
     * e devolve estoque. Pedido já pago no MP não pode ir para CANCELLED por este fluxo.
     */
    private void applyAdminCancellation(Order order, OrderStatus previousStatus) {
        try {
            paymentService.cancelPendingPayments(order);
        } catch (BusinessException ex) {
            if (ex.getStatus() == HttpStatus.CONFLICT) {
                throw new BusinessException(
                        "Este pedido já está pago no Mercado Pago. Não cancele sem estornar: use REEMBOLSADO após o estorno.",
                        HttpStatus.CONFLICT);
            }
            throw ex;
        }

        if (previousStatus != OrderStatus.REFUNDED && previousStatus != OrderStatus.CANCELLED) {
            orderExpirationService.restoreStock(order);
        }
    }

    @Transactional
    public void handleWebhook(Map<String, Object> payload) {
        paymentService.handleWebhook(payload);
    }

    private Order getOrder(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Pedido não encontrado", HttpStatus.NOT_FOUND));
    }

    private Order getOrderWithAccess(Long id) {
        Order order = getOrder(id);
        if (!securityUtils.isAuthenticated()) {
            throw new BusinessException("Autenticação necessária", HttpStatus.UNAUTHORIZED);
        }
        var user = securityUtils.getCurrentUser();
        boolean isStaff = switch (user.getRole()) {
            case ADMIN, GERENTE, ESTOQUISTA -> true;
            default -> false;
        };
        if (!isStaff && (order.getUser() == null || !order.getUser().getId().equals(user.getId()))) {
            throw new BusinessException("Acesso negado a este pedido", HttpStatus.FORBIDDEN);
        }
        return order;
    }

    private OrderResponse toResponse(Order order) {
        String customerName = order.getUser() != null ? order.getUser().getName() : order.getGuestName();
        String customerEmail = order.getUser() != null ? order.getUser().getEmail() : order.getGuestEmail();
        String customerPhone = order.getUser() != null && order.getUser().getPhone() != null
                ? order.getUser().getPhone()
                : order.getGuestPhone();
        String customerCpf = order.getUser() != null && order.getUser().getCpf() != null
                ? order.getUser().getCpf()
                : order.getGuestCpf();
        boolean canPay = order.getStatus() == OrderStatus.PENDING_PAYMENT
                && (order.getPaymentExpiresAt() == null || order.getPaymentExpiresAt().isAfter(LocalDateTime.now()));
        boolean requiresCpf = !hasValidCpf(customerCpf);

        return OrderResponse.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
                .status(order.getStatus())
                .subtotal(order.getSubtotal())
                .shippingCost(order.getShippingCost() != null ? order.getShippingCost() : java.math.BigDecimal.ZERO)
                .shippingServiceName(order.getShippingServiceName())
                .shippingDeadlineDays(order.getShippingDeadlineDays())
                .total(order.getTotal())
                .wholesaleApplied(order.getWholesaleApplied())
                .paymentMethod(order.getPaymentMethod())
                .paymentExpiresAt(order.getPaymentExpiresAt())
                .canPay(canPay)
                .requiresCpf(requiresCpf)
                .customerName(customerName)
                .customerEmail(customerEmail)
                .customerPhone(customerPhone)
                .customerCpf(customerCpf)
                .items(order.getItems().stream()
                        .map(i -> {
                            String imageUrl = i.getProductImageUrl();
                            if ((imageUrl == null || imageUrl.isBlank()) && i.getProduct() != null) {
                                imageUrl = i.getProduct().getMainImageUrl();
                            }
                            Long categoryId = null;
                            String categoryName = null;
                            if (i.getProduct() != null && i.getProduct().getCategory() != null) {
                                categoryId = i.getProduct().getCategory().getId();
                                categoryName = i.getProduct().getCategory().getName();
                            }
                            return OrderResponse.OrderItemResponse.builder()
                                    .productId(i.getProduct() != null ? i.getProduct().getId() : null)
                                    .productTitle(i.getProductTitle())
                                    .productImageUrl(imageUrl)
                                    .categoryId(categoryId)
                                    .categoryName(categoryName)
                                    .colorName(i.getColorName())
                                    .sizeName(i.getSizeName())
                                    .quantity(i.getQuantity())
                                    .unitPrice(i.getUnitPrice())
                                    .totalPrice(i.getTotalPrice())
                                    .build();
                        })
                        .toList())
                .shipping(OrderResponse.ShippingInfo.builder()
                        .cep(order.getShippingCep())
                        .street(order.getShippingStreet())
                        .number(order.getShippingNumber())
                        .neighborhood(order.getShippingNeighborhood())
                        .city(order.getShippingCity())
                        .state(order.getShippingState())
                        .complement(order.getShippingComplement())
                        .reference(order.getShippingReference())
                        .cost(order.getShippingCost() != null ? order.getShippingCost() : java.math.BigDecimal.ZERO)
                        .serviceCode(order.getShippingServiceCode())
                        .serviceName(order.getShippingServiceName())
                        .deadlineDays(order.getShippingDeadlineDays())
                        .build())
                .statusHistory(order.getStatusHistory().stream()
                        .sorted(Comparator.comparing(h -> h.getCreatedAt() != null ? h.getCreatedAt() : LocalDateTime.MIN))
                        .map(h -> OrderResponse.StatusHistoryEntry.builder()
                                .id(h.getId())
                                .status(h.getStatus())
                                .observation(h.getObservation())
                                .createdBy(h.getCreatedBy())
                                .createdAt(h.getCreatedAt())
                                .build())
                        .toList())
                .createdAt(order.getCreatedAt())
                .build();
    }

    private boolean hasValidCpf(String cpf) {
        if (cpf == null || cpf.isBlank()) {
            return false;
        }
        return cpf.replaceAll("\\D", "").length() == 11;
    }
}
