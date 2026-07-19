package com.ateliegg.service;

import com.ateliegg.config.AtelieProperties;
import com.ateliegg.domain.entity.Order;
import com.ateliegg.dto.payment.CardPaymentRequest;
import com.ateliegg.exception.BusinessException;
import com.mercadopago.MercadoPagoConfig;
import com.mercadopago.client.common.IdentificationRequest;
import com.mercadopago.client.payment.PaymentClient;
import com.mercadopago.client.payment.PaymentCreateRequest;
import com.mercadopago.client.payment.PaymentPayerRequest;
import com.mercadopago.resources.payment.Payment;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Slf4j
@Service
@RequiredArgsConstructor
public class MercadoPagoService {

    private final AtelieProperties properties;
    private final PaymentClient paymentClient = new PaymentClient();

    @PostConstruct
    public void init() {
        String token = properties.getMercadopago().getAccessToken();
        if (StringUtils.hasText(token)) {
            MercadoPagoConfig.setAccessToken(token);
            log.info("Mercado Pago Payment API configurada");
        } else {
            log.warn("Mercado Pago não configurado — defina MERCADOPAGO_ACCESS_TOKEN no .env");
        }
    }

    public Payment createPixPayment(Order order) {
        ensureConfigured();
        try {
            PaymentCreateRequest request = PaymentCreateRequest.builder()
                    .transactionAmount(toMoney(order.getTotal()))
                    .description("Pedido " + order.getOrderNumber())
                    .paymentMethodId("pix")
                    .externalReference(order.getOrderNumber())
                    .payer(buildPayer(order))
                    .build();
            return paymentClient.create(request);
        } catch (Exception e) {
            log.error("Erro PIX Mercado Pago: {}", e.getMessage());
            throw new BusinessException(
                    "Erro ao gerar PIX: " + e.getMessage(), HttpStatus.BAD_GATEWAY);
        }
    }

    public Payment createCardPayment(Order order, CardPaymentRequest card) {
        ensureConfigured();
        try {
            PaymentCreateRequest.PaymentCreateRequestBuilder builder = PaymentCreateRequest.builder()
                    .transactionAmount(toMoney(order.getTotal()))
                    .description("Pedido " + order.getOrderNumber())
                    .token(card.getToken())
                    .installments(card.getInstallments())
                    .paymentMethodId(card.getPaymentMethodId())
                    .externalReference(order.getOrderNumber())
                    .payer(PaymentPayerRequest.builder()
                            .email(card.getPayerEmail())
                            .firstName(firstName(card.getPayerName()))
                            .lastName(lastName(card.getPayerName()))
                            .identification(IdentificationRequest.builder()
                                    .type("CPF")
                                    .number(sanitizeCpf(card.getPayerCpf()))
                                    .build())
                            .build());

            if (StringUtils.hasText(card.getIssuerId())) {
                builder.issuerId(card.getIssuerId());
            }

            return paymentClient.create(builder.build());
        } catch (Exception e) {
            log.error("Erro cartão Mercado Pago: {}", e.getMessage());
            throw new BusinessException(
                    "Erro ao processar cartão: " + e.getMessage(), HttpStatus.BAD_GATEWAY);
        }
    }

    public Payment getPayment(String paymentId) {
        ensureConfigured();
        try {
            return paymentClient.get(Long.parseLong(paymentId));
        } catch (Exception e) {
            throw new BusinessException(
                    "Erro ao consultar pagamento: " + e.getMessage(), HttpStatus.BAD_GATEWAY);
        }
    }

    public Payment cancelPayment(String paymentId) {
        ensureConfigured();
        try {
            return paymentClient.cancel(Long.parseLong(paymentId));
        } catch (Exception e) {
            log.error("Erro ao cancelar pagamento Mercado Pago {}: {}", paymentId, e.getMessage());
            throw new BusinessException(
                    "Erro ao cancelar pagamento no Mercado Pago: " + e.getMessage(),
                    HttpStatus.BAD_GATEWAY);
        }
    }

    public String getPublicKey() {
        return properties.getMercadopago().getPublicKey();
    }

    public int getPaymentExpirationHours() {
        return properties.getOrders().getPaymentExpirationHours();
    }

    private void ensureConfigured() {
        if (!StringUtils.hasText(properties.getMercadopago().getAccessToken())) {
            throw new BusinessException(
                    "Mercado Pago não configurado. Defina MERCADOPAGO_ACCESS_TOKEN no .env",
                    HttpStatus.SERVICE_UNAVAILABLE);
        }
    }

    private PaymentPayerRequest buildPayer(Order order) {
        String email = order.getGuestEmail();
        String name = order.getGuestName();
        String cpf = order.getGuestCpf();

        if (order.getUser() != null) {
            if (!StringUtils.hasText(email)) {
                email = order.getUser().getEmail();
            }
            if (!StringUtils.hasText(name)) {
                name = order.getUser().getName();
            }
            if (!StringUtils.hasText(cpf)) {
                cpf = order.getUser().getCpf();
            }
        }

        if (!StringUtils.hasText(email)) {
            throw new BusinessException(
                    "E-mail do pagador é obrigatório. Atualize seus dados em Minha conta.",
                    HttpStatus.BAD_REQUEST);
        }
        if (!StringUtils.hasText(cpf) || sanitizeCpf(cpf).length() != 11) {
            throw new BusinessException(
                    "Informe um CPF válido para pagar. Você pode preencher na tela de pagamento.",
                    HttpStatus.BAD_REQUEST);
        }

        return PaymentPayerRequest.builder()
                .email(email)
                .firstName(firstName(name))
                .lastName(lastName(name))
                .identification(IdentificationRequest.builder()
                        .type("CPF")
                        .number(sanitizeCpf(cpf))
                        .build())
                .build();
    }

    private BigDecimal toMoney(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }

    private String firstName(String fullName) {
        if (!StringUtils.hasText(fullName)) {
            return "Cliente";
        }
        return fullName.trim().split("\\s+")[0];
    }

    private String lastName(String fullName) {
        if (!StringUtils.hasText(fullName)) {
            return "GIG";
        }
        String[] parts = fullName.trim().split("\\s+");
        return parts.length > 1 ? parts[parts.length - 1] : "GIG";
    }

    private String sanitizeCpf(String cpf) {
        return cpf.replaceAll("\\D", "");
    }
}
