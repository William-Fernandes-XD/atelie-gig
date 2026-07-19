package com.ateliegg.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "atelie")
@Getter
@Setter
public class AtelieProperties {

    private Jwt jwt = new Jwt();
    private Cors cors = new Cors();
    private Upload upload = new Upload();
    private Mercadopago mercadopago = new Mercadopago();
    private Admin admin = new Admin();
    private Mail mail = new Mail();
    private Orders orders = new Orders();
    private Google google = new Google();
    private Shipping shipping = new Shipping();

    @Getter
    @Setter
    public static class Jwt {
        private String secret;
        private long expirationMs;
    }

    @Getter
    @Setter
    public static class Cors {
        private String allowedOrigins;
    }

    @Getter
    @Setter
    public static class Upload {
        private String dir;
    }

    @Getter
    @Setter
    public static class Mercadopago {
        private String publicKey;
        private String accessToken;
        private String clientId;
        private String clientSecret;
        private String webhookSecret;
        private String successUrl;
        private String failureUrl;
        private String pendingUrl;
    }

    @Getter
    @Setter
    public static class Mail {
        private String host;
        private int port;
        private String username;
        private String password;
        private String from;
    }

    @Getter
    @Setter
    public static class Orders {
        private int paymentExpirationHours = 24;
    }

    @Getter
    @Setter
    public static class Google {
        /** Client ID OAuth Web (mesmo do frontend / Google Identity Services). */
        private String clientId;
    }

    @Getter
    @Setter
    public static class Admin {
        private String name;
        private String email;
        private String password;
        private boolean resetPassword;
    }

    @Getter
    @Setter
    public static class Shipping {
        /** CEP da loja/origem (somente dígitos ou com hífen). */
        private String originCep = "01310100";
        private double weightPerItemKg = 0.35;
        private double maxWeightKg = 10;
        private int packageLengthCm = 30;
        private int packageHeightCm = 10;
        private int packageWidthCm = 25;
        private int timeoutMs = 2500;
        /**
         * Se true, tenta a WS legada CalcPrecoPrazo (geralmente indisponível).
         * Padrão false: cotação instantânea por UF via ViaCEP.
         */
        private boolean tryLegacyApi = false;
    }
}
