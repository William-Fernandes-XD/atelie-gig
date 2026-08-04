package com.ateliegg.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

/**
 * Em APP_ENV=production, desliga Swagger/OpenAPI automaticamente.
 */
public class ProductionSecurityEnvironmentPostProcessor implements EnvironmentPostProcessor {

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        String appEnv = environment.getProperty("APP_ENV", "development").toLowerCase(Locale.ROOT);
        if (!appEnv.equals("production") && !appEnv.equals("prod")) {
            return;
        }

        Map<String, Object> defaults = new HashMap<>();
        // Só aplica se o usuário não definiu SWAGGER_ENABLED explicitamente como true
        String swaggerOverride = environment.getProperty("SWAGGER_ENABLED");
        if (swaggerOverride == null || !Boolean.parseBoolean(swaggerOverride)) {
            defaults.put("springdoc.api-docs.enabled", "false");
            defaults.put("springdoc.swagger-ui.enabled", "false");
        }

        if (!defaults.isEmpty()) {
            environment.getPropertySources()
                    .addFirst(new MapPropertySource("productionSecurityDefaults", defaults));
        }
    }
}
