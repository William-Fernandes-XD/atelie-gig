package com.ateliegg.service;

import com.ateliegg.domain.entity.*;
import com.ateliegg.domain.enums.OrderStatus;
import com.ateliegg.dto.checkout.CheckoutItemRequest;
import com.ateliegg.dto.checkout.CheckoutRequest;
import com.ateliegg.dto.checkout.CheckoutResponse;
import com.ateliegg.exception.BusinessException;
import com.ateliegg.repository.AddressRepository;
import com.ateliegg.repository.OrderRepository;
import com.ateliegg.repository.ProductRepository;
import com.ateliegg.repository.StockRepository;
import com.ateliegg.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CheckoutService {

    private static final int IDEMPOTENCY_WINDOW_MINUTES = 5;

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final StockRepository stockRepository;
    private final AddressRepository addressRepository;
    private final SecurityUtils securityUtils;
    private final MercadoPagoService mercadoPagoService;
    private final OrderStatusHistoryService orderStatusHistoryService;
    private final CorreiosShippingService correiosShippingService;

    /** Evita duplo clique / requisições paralelas do mesmo usuário. */
    private final ConcurrentHashMap<Long, Object> userCheckoutLocks = new ConcurrentHashMap<>();

    @Transactional
    public CheckoutResponse processCheckout(CheckoutRequest request) {
        if (!securityUtils.isAuthenticated()) {
            throw new BusinessException(
                    "Faça login ou cadastre-se para finalizar a compra", HttpStatus.UNAUTHORIZED);
        }

        User user = securityUtils.getCurrentUser();
        Object lock = userCheckoutLocks.computeIfAbsent(user.getId(), id -> new Object());

        synchronized (lock) {
            return doCheckout(user, request);
        }
    }

    private CheckoutResponse doCheckout(User user, CheckoutRequest request) {
        String fingerprint = buildItemsFingerprint(request.getItems());

        // Idempotência: pedido pendente idêntico nos últimos minutos → reutiliza (evita duplicata)
        var existingOpt = orderRepository
                .findFirstByUserIdAndStatusAndCreatedAtAfterOrderByCreatedAtDesc(
                        user.getId(),
                        OrderStatus.PENDING_PAYMENT,
                        LocalDateTime.now().minusMinutes(IDEMPOTENCY_WINDOW_MINUTES))
                .flatMap(candidate -> orderRepository.findByIdWithItems(candidate.getId()))
                .filter(existing -> Objects.equals(fingerprint, fingerprintOfOrder(existing)));

        String serviceCode = request.getShippingServiceCode() != null
                ? request.getShippingServiceCode().trim()
                : "";
        if (serviceCode.isBlank()) {
            throw new BusinessException("Selecione uma opção de frete antes de finalizar.", HttpStatus.BAD_REQUEST);
        }

        int totalQuantity = request.getItems().stream()
                .mapToInt(CheckoutItemRequest::getQuantity)
                .sum();
        boolean wholesaleApplied = totalQuantity > 3;

        CheckoutRequest.ShippingAddress shipping = resolveShipping(user, request);
        var freight = correiosShippingService.quoteSelected(
                shipping.getCep(),
                totalQuantity,
                serviceCode);

        // Pedido pendente idêntico: atualiza endereço/frete e reutiliza (evita nova baixa de estoque)
        if (existingOpt.isPresent()) {
            Order existing = existingOpt.get();
            applyShipping(existing, shipping, freight);
            existing.setTotal(existing.getSubtotal().add(freight.getPrice()));
            return toCheckoutResponse(orderRepository.save(existing));
        }

        Order order = Order.builder()
                .orderNumber(generateOrderNumber())
                .user(user)
                .guestName(user.getName())
                .guestEmail(user.getEmail())
                .guestPhone(user.getPhone())
                .guestCpf(user.getCpf())
                .status(OrderStatus.PENDING_PAYMENT)
                .wholesaleApplied(wholesaleApplied)
                .items(new ArrayList<>())
                .statusHistory(new ArrayList<>())
                .build();
        applyShipping(order, shipping, freight);

        BigDecimal subtotal = BigDecimal.ZERO;

        for (var itemReq : request.getItems()) {
            Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new BusinessException("Produto não encontrado: " + itemReq.getProductId()));

            ProductColor color = product.getColors().stream()
                    .filter(c -> c.getName().equalsIgnoreCase(itemReq.getColorName()))
                    .findFirst()
                    .orElseThrow(() -> new BusinessException("Cor inválida: " + itemReq.getColorName()));

            ProductSize size = product.getSizes().stream()
                    .filter(s -> s.getName().equalsIgnoreCase(itemReq.getSizeName()))
                    .findFirst()
                    .orElseThrow(() -> new BusinessException("Tamanho inválido: " + itemReq.getSizeName()));

            Stock stock = stockRepository.findByProductIdAndColorIdAndSizeIdForUpdate(
                            product.getId(), color.getId(), size.getId())
                    .orElseThrow(() -> new BusinessException("Estoque não encontrado para a combinação selecionada"));

            if (stock.getQuantity() < itemReq.getQuantity()) {
                throw new BusinessException("Estoque insuficiente para " + product.getTitle()
                        + " (" + color.getName() + " / " + size.getName() + ")");
            }

            BigDecimal unitPrice = wholesaleApplied ? product.getWholesalePrice() : product.getPrice();
            BigDecimal itemTotal = unitPrice.multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            subtotal = subtotal.add(itemTotal);

            stock.setQuantity(stock.getQuantity() - itemReq.getQuantity());
            stockRepository.save(stock);

            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .product(product)
                    .productTitle(product.getTitle())
                    .productImageUrl(product.getMainImageUrl())
                    .colorName(color.getName())
                    .sizeName(size.getName())
                    .quantity(itemReq.getQuantity())
                    .unitPrice(unitPrice)
                    .totalPrice(itemTotal)
                    .build();

            order.getItems().add(orderItem);
        }

        order.setSubtotal(subtotal);
        order.setTotal(subtotal.add(freight.getPrice()));
        order.setPaymentExpiresAt(LocalDateTime.now().plusHours(
                mercadoPagoService.getPaymentExpirationHours()));

        orderStatusHistoryService.record(
                order,
                OrderStatus.PENDING_PAYMENT,
                null,
                "sistema");

        order = orderRepository.save(order);
        return toCheckoutResponse(order);
    }

    private CheckoutResponse toCheckoutResponse(Order order) {
        return CheckoutResponse.builder()
                .orderId(order.getId())
                .orderNumber(order.getOrderNumber())
                .subtotal(order.getSubtotal())
                .shippingCost(order.getShippingCost() != null ? order.getShippingCost() : BigDecimal.ZERO)
                .shippingServiceName(order.getShippingServiceName())
                .shippingDeadlineDays(order.getShippingDeadlineDays())
                .total(order.getTotal())
                .wholesaleApplied(order.getWholesaleApplied())
                .build();
    }

    private void applyShipping(
            Order order,
            CheckoutRequest.ShippingAddress shipping,
            com.ateliegg.dto.shipping.ShippingQuoteResponse.ShippingOption freight) {
        order.setShippingCep(shipping.getCep());
        order.setShippingStreet(shipping.getStreet());
        order.setShippingNumber(shipping.getNumber());
        order.setShippingNeighborhood(shipping.getNeighborhood());
        order.setShippingCity(shipping.getCity());
        order.setShippingState(shipping.getState());
        order.setShippingComplement(shipping.getComplement());
        order.setShippingReference(shipping.getReference());
        order.setShippingCost(freight.getPrice());
        order.setShippingServiceCode(freight.getServiceCode());
        order.setShippingServiceName(freight.getServiceName());
        order.setShippingDeadlineDays(freight.getDeadlineDays());
    }

    private String buildItemsFingerprint(List<CheckoutItemRequest> items) {
        return items.stream()
                .sorted(Comparator
                        .comparing(CheckoutItemRequest::getProductId)
                        .thenComparing(CheckoutItemRequest::getColorName, String.CASE_INSENSITIVE_ORDER)
                        .thenComparing(CheckoutItemRequest::getSizeName, String.CASE_INSENSITIVE_ORDER))
                .map(i -> i.getProductId() + "|"
                        + i.getColorName().trim().toLowerCase() + "|"
                        + i.getSizeName().trim().toLowerCase() + "|"
                        + i.getQuantity())
                .collect(Collectors.joining(";"));
    }

    private String fingerprintOfOrder(Order order) {
        return order.getItems().stream()
                .sorted(Comparator
                        .comparing((OrderItem i) -> i.getProduct() != null ? i.getProduct().getId() : 0L)
                        .thenComparing(OrderItem::getColorName, String.CASE_INSENSITIVE_ORDER)
                        .thenComparing(OrderItem::getSizeName, String.CASE_INSENSITIVE_ORDER))
                .map(i -> (i.getProduct() != null ? i.getProduct().getId() : 0) + "|"
                        + i.getColorName().trim().toLowerCase() + "|"
                        + i.getSizeName().trim().toLowerCase() + "|"
                        + i.getQuantity())
                .collect(Collectors.joining(";"));
    }

    private CheckoutRequest.ShippingAddress resolveShipping(User user, CheckoutRequest request) {
        if (request.getShipping() != null
                && request.getShipping().getCep() != null
                && !request.getShipping().getCep().isBlank()
                && request.getShipping().getStreet() != null
                && !request.getShipping().getStreet().isBlank()) {
            return request.getShipping();
        }

        return addressRepository.findByUserIdAndIsDefaultTrue(user.getId())
                .map(addr -> {
                    CheckoutRequest.ShippingAddress shipping = new CheckoutRequest.ShippingAddress();
                    shipping.setCep(addr.getCep());
                    shipping.setStreet(addr.getStreet());
                    shipping.setNumber(addr.getNumber());
                    shipping.setNeighborhood(addr.getNeighborhood());
                    shipping.setCity(addr.getCity());
                    shipping.setState(addr.getState());
                    shipping.setComplement(addr.getComplement());
                    shipping.setReference(addr.getReference());
                    return shipping;
                })
                .orElseThrow(() -> new BusinessException(
                        "Endereço de entrega é obrigatório. Complete em Minha conta."));
    }

    private String generateOrderNumber() {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        int suffix = (int) (Math.random() * 900) + 100;
        return "AGG-" + timestamp + "-" + suffix;
    }
}
