package com.ateliegg.service;

import com.ateliegg.domain.entity.Order;
import com.ateliegg.domain.entity.PaymentTransaction;
import com.ateliegg.domain.entity.User;
import com.ateliegg.domain.enums.OrderStatus;
import com.ateliegg.domain.enums.PaymentMethod;
import com.ateliegg.domain.enums.PaymentTransactionStatus;
import com.ateliegg.dto.payment.CardPaymentRequest;
import com.ateliegg.dto.payment.PaymentConfigResponse;
import com.ateliegg.dto.payment.PaymentResponse;
import com.ateliegg.dto.payment.PixPaymentRequest;
import com.ateliegg.exception.BusinessException;
import com.ateliegg.repository.OrderRepository;
import com.ateliegg.repository.PaymentTransactionRepository;
import com.ateliegg.repository.UserRepository;
import com.ateliegg.security.SecurityUtils;
import com.mercadopago.resources.payment.Payment;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final MercadoPagoService mercadoPagoService;
    private final OrderRepository orderRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final UserRepository userRepository;
    private final SecurityUtils securityUtils;
    private final OrderStatusHistoryService orderStatusHistoryService;

    public PaymentConfigResponse getConfig() {
        return PaymentConfigResponse.builder()
                .publicKey(mercadoPagoService.getPublicKey())
                .build();
    }

    @Transactional
    public PaymentResponse createPixPayment(Long orderId, PixPaymentRequest request) {
        Order order = getPayableOrder(orderId);
        applyPayerCpfIfNeeded(order, request != null ? request.getPayerCpf() : null);

        PaymentTransaction existing = paymentTransactionRepository
                .findFirstByOrderIdAndStatusOrderByCreatedAtDesc(orderId, PaymentTransactionStatus.PENDING)
                .filter(tx -> tx.getMethod() == PaymentMethod.PIX)
                .filter(tx -> tx.getPixExpiration() == null || tx.getPixExpiration().isAfter(LocalDateTime.now()))
                .filter(tx -> StringUtils.hasText(tx.getPixQrCode()))
                .orElse(null);

        if (existing != null) {
            return toResponse(order, existing);
        }

        Payment payment = mercadoPagoService.createPixPayment(order);
        PaymentTransaction transaction = saveTransaction(order, payment, PaymentMethod.PIX);
        applyPaymentToOrder(order, transaction);
        return toResponse(order, transaction);
    }

    @Transactional
    public PaymentResponse createCardPayment(Long orderId, CardPaymentRequest request) {
        Order order = getPayableOrder(orderId);
        applyPayerCpfIfNeeded(order, request.getPayerCpf());
        Payment payment = mercadoPagoService.createCardPayment(order, request);
        PaymentTransaction transaction = saveTransaction(order, payment, PaymentMethod.CREDIT_CARD);
        applyPaymentToOrder(order, transaction);
        return toResponse(order, transaction);
    }

    /**
     * Cancela pagamentos pendentes no Mercado Pago e marca as transações locais como canceladas.
     * Se algum pagamento já estiver aprovado, impede o cancelamento do pedido.
     */
    @Transactional
    public void cancelPendingPayments(Order order) {
        CancelPaymentsResult result = cancelPendingPaymentsInternal(order, true);
        if (result == CancelPaymentsResult.ALREADY_PAID) {
            throw new BusinessException(
                    "Este pedido já foi pago e não pode ser cancelado.",
                    HttpStatus.CONFLICT);
        }
    }

    /**
     * Variante para expiração automática (24h): cancela no MP sem lançar se já estiver pago.
     * @return true se os pagamentos foram cancelados (ou não havia); false se o pedido já estava pago no MP
     */
    @Transactional
    public boolean cancelPendingPaymentsForExpiration(Order order) {
        return cancelPendingPaymentsInternal(order, false) != CancelPaymentsResult.ALREADY_PAID;
    }

    private enum CancelPaymentsResult {
        CANCELLED,
        ALREADY_PAID
    }

    private CancelPaymentsResult cancelPendingPaymentsInternal(Order order, boolean throwIfApproved) {
        var transactions = paymentTransactionRepository.findByOrderIdOrderByCreatedAtDesc(order.getId());

        for (PaymentTransaction tx : transactions) {
            if (tx.getStatus() == PaymentTransactionStatus.CANCELLED
                    || tx.getStatus() == PaymentTransactionStatus.REJECTED
                    || tx.getStatus() == PaymentTransactionStatus.EXPIRED) {
                continue;
            }

            if (StringUtils.hasText(tx.getMercadopagoPaymentId())) {
                try {
                    Payment payment = mercadoPagoService.getPayment(tx.getMercadopagoPaymentId());
                    String status = payment.getStatus() != null ? payment.getStatus().toLowerCase() : "";

                    if ("approved".equals(status)) {
                        updateTransactionFromPayment(tx, payment);
                        applyPaymentToOrder(order, tx);
                        paymentTransactionRepository.save(tx);
                        orderRepository.save(order);
                        if (throwIfApproved) {
                            return CancelPaymentsResult.ALREADY_PAID;
                        }
                        return CancelPaymentsResult.ALREADY_PAID;
                    }

                    if ("pending".equals(status) || "in_process".equals(status) || "authorized".equals(status)) {
                        Payment cancelled = mercadoPagoService.cancelPayment(tx.getMercadopagoPaymentId());
                        updateTransactionFromPayment(tx, cancelled);
                    } else {
                        updateTransactionFromPayment(tx, payment);
                    }
                } catch (BusinessException ex) {
                    if (throwIfApproved) {
                        throw ex;
                    }
                    log.warn("Falha ao cancelar pagamento MP {} do pedido {}: {}",
                            tx.getMercadopagoPaymentId(), order.getOrderNumber(), ex.getMessage());
                    tx.setStatus(PaymentTransactionStatus.CANCELLED);
                    tx.setStatusDetail("cancel_mp_failed:" + ex.getMessage());
                }
            } else {
                tx.setStatus(PaymentTransactionStatus.CANCELLED);
                tx.setStatusDetail(throwIfApproved ? "cancelled_by_customer" : "cancelled_by_expiration");
            }

            if (tx.getStatus() != PaymentTransactionStatus.CANCELLED
                    && tx.getStatus() != PaymentTransactionStatus.REJECTED
                    && tx.getStatus() != PaymentTransactionStatus.EXPIRED) {
                tx.setStatus(PaymentTransactionStatus.CANCELLED);
                if (!StringUtils.hasText(tx.getStatusDetail())) {
                    tx.setStatusDetail(throwIfApproved ? "cancelled_by_customer" : "cancelled_by_expiration");
                }
            }
            paymentTransactionRepository.save(tx);
        }

        return CancelPaymentsResult.CANCELLED;
    }

    @Transactional
    public PaymentResponse syncOrderPayment(Long orderId) {
        Order order = getOrderForUser(orderId);
        PaymentTransaction pending = paymentTransactionRepository
                .findFirstByOrderIdAndStatusOrderByCreatedAtDesc(orderId, PaymentTransactionStatus.PENDING)
                .orElse(null);

        if (pending != null && StringUtils.hasText(pending.getMercadopagoPaymentId())) {
            Payment payment = mercadoPagoService.getPayment(pending.getMercadopagoPaymentId());
            updateTransactionFromPayment(pending, payment);
            applyPaymentToOrder(order, pending);
            paymentTransactionRepository.save(pending);
        }

        if (pending != null) {
            return toResponse(order, pending);
        }

        return PaymentResponse.builder()
                .orderId(order.getId())
                .orderNumber(order.getOrderNumber())
                .orderPaid(order.getStatus() == OrderStatus.PAID)
                .status(mapOrderToPaymentStatus(order))
                .amount(order.getTotal())
                .build();
    }

    @Transactional
    public void handleWebhook(Map<String, Object> payload) {
        Object data = payload.get("data");
        if (!(data instanceof Map<?, ?> dataMap)) {
            return;
        }
        Object id = dataMap.get("id");
        if (id == null) {
            return;
        }

        String paymentId = id.toString();
        Payment payment = mercadoPagoService.getPayment(paymentId);

        PaymentTransaction transaction = paymentTransactionRepository
                .findByMercadopagoPaymentId(paymentId)
                .orElseGet(() -> findOrCreateByExternalReference(payment));

        if (transaction == null) {
            return;
        }

        updateTransactionFromPayment(transaction, payment);
        paymentTransactionRepository.save(transaction);

        Order order = transaction.getOrder();
        applyPaymentToOrder(order, transaction);
        orderRepository.save(order);
    }

    private PaymentTransaction findOrCreateByExternalReference(Payment payment) {
        String orderNumber = payment.getExternalReference();
        if (!StringUtils.hasText(orderNumber)) {
            return null;
        }
        return orderRepository.findByOrderNumber(orderNumber)
                .map(order -> {
                    PaymentTransaction tx = PaymentTransaction.builder()
                            .order(order)
                            .mercadopagoPaymentId(String.valueOf(payment.getId()))
                            .method("pix".equalsIgnoreCase(payment.getPaymentMethodId())
                                    ? PaymentMethod.PIX : PaymentMethod.CREDIT_CARD)
                            .amount(order.getTotal())
                            .build();
                    updateTransactionFromPayment(tx, payment);
                    return paymentTransactionRepository.save(tx);
                })
                .orElse(null);
    }

    private Order getPayableOrder(Long orderId) {
        Order order = getOrderForUser(orderId);
        if (order.getStatus() != OrderStatus.PENDING_PAYMENT) {
            throw new BusinessException("Este pedido não está aguardando pagamento");
        }
        if (order.getPaymentExpiresAt() != null && order.getPaymentExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BusinessException("O prazo para pagamento deste pedido expirou");
        }
        return order;
    }

    /**
     * Se o pedido/usuário ainda não tem CPF, usa o informado na tela de pagamento
     * e persiste no usuário (quando autenticado) e no pedido.
     */
    private void applyPayerCpfIfNeeded(Order order, String payerCpf) {
        String current = resolveOrderCpf(order);
        if (hasValidCpf(current)) {
            return;
        }

        if (!hasValidCpf(payerCpf)) {
            throw new BusinessException(
                    "Informe um CPF válido com 11 dígitos para concluir o pagamento.",
                    HttpStatus.BAD_REQUEST);
        }

        String normalized = formatCpf(payerCpf);
        order.setGuestCpf(normalized);

        User user = order.getUser();
        if (user != null && !hasValidCpf(user.getCpf())) {
            user.setCpf(normalized);
            userRepository.save(user);
        }

        orderRepository.save(order);
    }

    private String resolveOrderCpf(Order order) {
        if (order.getUser() != null && hasValidCpf(order.getUser().getCpf())) {
            return order.getUser().getCpf();
        }
        return order.getGuestCpf();
    }

    private boolean hasValidCpf(String cpf) {
        return StringUtils.hasText(cpf) && cpf.replaceAll("\\D", "").length() == 11;
    }

    private String formatCpf(String cpf) {
        String digits = cpf.replaceAll("\\D", "");
        return digits.substring(0, 3) + "." + digits.substring(3, 6) + "."
                + digits.substring(6, 9) + "-" + digits.substring(9);
    }

    private Order getOrderForUser(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new BusinessException("Pedido não encontrado", HttpStatus.NOT_FOUND));

        if (securityUtils.isAuthenticated()) {
            var user = securityUtils.getCurrentUser();
            boolean isStaff = user.getRole().name().matches("ADMIN|GERENTE|ESTOQUISTA");
            if (!isStaff && (order.getUser() == null || !order.getUser().getId().equals(user.getId()))) {
                throw new BusinessException("Acesso negado a este pedido", HttpStatus.FORBIDDEN);
            }
        }
        return order;
    }

    private PaymentTransaction saveTransaction(Order order, Payment payment, PaymentMethod method) {
        PaymentTransaction transaction = PaymentTransaction.builder()
                .order(order)
                .mercadopagoPaymentId(String.valueOf(payment.getId()))
                .method(method)
                .amount(order.getTotal())
                .build();
        updateTransactionFromPayment(transaction, payment);
        return paymentTransactionRepository.save(transaction);
    }

    private void updateTransactionFromPayment(PaymentTransaction transaction, Payment payment) {
        transaction.setMercadopagoPaymentId(String.valueOf(payment.getId()));
        transaction.setStatus(mapMpStatus(payment.getStatus()));
        transaction.setStatusDetail(payment.getStatusDetail());

        if (payment.getPointOfInteraction() != null
                && payment.getPointOfInteraction().getTransactionData() != null) {
            var txData = payment.getPointOfInteraction().getTransactionData();
            transaction.setPixQrCode(txData.getQrCode());
            transaction.setPixQrCodeBase64(txData.getQrCodeBase64());
            transaction.setPixExpiration(LocalDateTime.now().plusMinutes(30));
        }
    }

    private void applyPaymentToOrder(Order order, PaymentTransaction transaction) {
        order.setPaymentMethod(transaction.getMethod());
        order.setMercadopagoPaymentId(transaction.getMercadopagoPaymentId());

        if (transaction.getStatus() == PaymentTransactionStatus.APPROVED
                && order.getStatus() == OrderStatus.PENDING_PAYMENT) {
            order.setStatus(OrderStatus.PAID);
            orderStatusHistoryService.record(order, OrderStatus.PAID, null, "sistema");
        }
    }

    private PaymentTransactionStatus mapMpStatus(String status) {
        if (status == null) {
            return PaymentTransactionStatus.PENDING;
        }
        return switch (status.toLowerCase()) {
            case "approved" -> PaymentTransactionStatus.APPROVED;
            case "rejected" -> PaymentTransactionStatus.REJECTED;
            case "cancelled" -> PaymentTransactionStatus.CANCELLED;
            case "expired" -> PaymentTransactionStatus.EXPIRED;
            default -> PaymentTransactionStatus.PENDING;
        };
    }

    private PaymentTransactionStatus mapOrderToPaymentStatus(Order order) {
        if (order.getStatus() == OrderStatus.PAID) {
            return PaymentTransactionStatus.APPROVED;
        }
        if (order.getStatus() == OrderStatus.CANCELLED) {
            return PaymentTransactionStatus.CANCELLED;
        }
        return PaymentTransactionStatus.PENDING;
    }

    private PaymentResponse toResponse(Order order, PaymentTransaction transaction) {
        return PaymentResponse.builder()
                .transactionId(transaction.getId())
                .orderId(order.getId())
                .orderNumber(order.getOrderNumber())
                .method(transaction.getMethod())
                .status(transaction.getStatus())
                .statusDetail(transaction.getStatusDetail())
                .amount(transaction.getAmount())
                .mercadopagoPaymentId(transaction.getMercadopagoPaymentId())
                .pixQrCode(transaction.getPixQrCode())
                .pixQrCodeBase64(transaction.getPixQrCodeBase64())
                .pixExpiration(transaction.getPixExpiration())
                .orderPaid(order.getStatus() == OrderStatus.PAID)
                .build();
    }
}
