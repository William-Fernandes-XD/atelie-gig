package com.ateliegg.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * Impede subir em modo inseguro (JWT fraco / segredos padrão) quando APP_ENV=production.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class SecurityBootGuard implements ApplicationRunner {

    private final AtelieProperties properties;
    private final Environment environment;

    @Override
    public void run(ApplicationArguments args) {
        String appEnv = environment.getProperty("APP_ENV", "development").toLowerCase();
        boolean production = appEnv.equals("production") || appEnv.equals("prod");

        String jwt = properties.getJwt().getSecret();
        boolean weakJwt = !StringUtils.hasText(jwt)
                || jwt.contains("change-me")
                || jwt.contains("altere-esta-chave")
                || jwt.length() < 32;

        if (weakJwt) {
            if (production) {
                throw new IllegalStateException(
                        "JWT_SECRET inseguro ou ausente. Defina uma chave forte (64+ chars) no .env antes de subir em produção.");
            }
            log.warn("JWT_SECRET fraco/padrão — aceitável só em desenvolvimento.");
        }

        if (production && !StringUtils.hasText(properties.getMercadopago().getAccessToken())) {
            throw new IllegalStateException("MERCADOPAGO_ACCESS_TOKEN obrigatório em produção.");
        }

        if (production && !StringUtils.hasText(properties.getMercadopago().getWebhookSecret())) {
            throw new IllegalStateException(
                    "MERCADOPAGO_WEBHOOK_SECRET obrigatório em produção (assinatura do webhook).");
        }

        if (production) {
            log.info("SecurityBootGuard: APP_ENV=production — checagens de segredo OK.");
        }
    }
}
