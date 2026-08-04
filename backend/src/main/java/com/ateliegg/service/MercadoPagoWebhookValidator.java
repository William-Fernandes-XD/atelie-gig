package com.ateliegg.service;

import com.ateliegg.config.AtelieProperties;
import com.ateliegg.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.Locale;

/**
 * Valida assinatura HMAC-SHA256 do webhook Mercado Pago (header x-signature).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class MercadoPagoWebhookValidator {

    private final AtelieProperties properties;
    private final Environment environment;

    public void validateOrThrow(String xSignature, String xRequestId, String dataId) {
        String secret = properties.getMercadopago().getWebhookSecret();
        boolean production = isProduction();

        if (!StringUtils.hasText(secret)) {
            if (production) {
                throw new BusinessException(
                        "Webhook não configurado",
                        HttpStatus.SERVICE_UNAVAILABLE);
            }
            log.warn("MERCADOPAGO_WEBHOOK_SECRET vazio — validação de webhook desativada (somente desenvolvimento).");
            return;
        }

        if (!StringUtils.hasText(xSignature)) {
            throw new BusinessException("Assinatura do webhook ausente", HttpStatus.UNAUTHORIZED);
        }

        String ts = null;
        String hash = null;
        for (String part : xSignature.split(",")) {
            String[] kv = part.split("=", 2);
            if (kv.length != 2) {
                continue;
            }
            String key = kv[0].trim();
            String value = kv[1].trim();
            if ("ts".equals(key)) {
                ts = value;
            } else if ("v1".equals(key)) {
                hash = value;
            }
        }

        if (!StringUtils.hasText(ts) || !StringUtils.hasText(hash)) {
            throw new BusinessException("Assinatura do webhook inválida", HttpStatus.UNAUTHORIZED);
        }

        StringBuilder manifest = new StringBuilder();
        if (StringUtils.hasText(dataId)) {
            manifest.append("id:").append(dataId.toLowerCase(Locale.ROOT)).append(";");
        }
        if (StringUtils.hasText(xRequestId)) {
            manifest.append("request-id:").append(xRequestId).append(";");
        }
        manifest.append("ts:").append(ts).append(";");

        String expected = hmacSha256Hex(secret, manifest.toString());
        if (!MessageDigest.isEqual(
                expected.getBytes(StandardCharsets.UTF_8),
                hash.getBytes(StandardCharsets.UTF_8))) {
            log.warn("Webhook Mercado Pago rejeitado: assinatura inválida");
            throw new BusinessException("Assinatura do webhook inválida", HttpStatus.UNAUTHORIZED);
        }
    }

    private boolean isProduction() {
        String appEnv = environment.getProperty("APP_ENV", "development").toLowerCase(Locale.ROOT);
        return appEnv.equals("production") || appEnv.equals("prod");
    }

    private static String hmacSha256Hex(String secret, String message) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] raw = mac.doFinal(message.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(raw);
        } catch (Exception ex) {
            throw new BusinessException("Falha ao validar webhook", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
