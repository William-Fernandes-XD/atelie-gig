package com.ateliegg.security;

import com.ateliegg.config.AtelieProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final RateLimitFilter rateLimitFilter;
    private final CustomUserDetailsService userDetailsService;
    private final AtelieProperties atelieProperties;
    private final Environment environment;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        boolean swaggerEnabled = isSwaggerEnabled();

        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> {
                    auth.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll();
                    auth.requestMatchers("/api/auth/**").permitAll();
                    auth.requestMatchers(HttpMethod.GET, "/api/payments/config").permitAll();
                    auth.requestMatchers(HttpMethod.POST, "/api/shipping/**").permitAll();
                    auth.requestMatchers(HttpMethod.POST, "/api/orders/webhook/**").permitAll();
                    auth.requestMatchers("/uploads/**").permitAll();

                    // Catálogo público (sem rotas /admin) — regras admin ANTES de {id}
                    auth.requestMatchers(HttpMethod.GET, "/api/products/admin/**")
                            .hasAnyRole("ADMIN", "GERENTE", "ESTOQUISTA");
                    auth.requestMatchers(HttpMethod.GET, "/api/products/filters").permitAll();
                    auth.requestMatchers(HttpMethod.GET, "/api/products").permitAll();
                    auth.requestMatchers(HttpMethod.GET, "/api/products/{id}").permitAll();
                    auth.requestMatchers(HttpMethod.GET, "/api/categories/**").permitAll();
                    auth.requestMatchers(HttpMethod.GET, "/api/cms/hero").permitAll();
                    auth.requestMatchers(HttpMethod.PUT, "/api/cms/hero").hasAnyRole("ADMIN", "GERENTE");
                    auth.requestMatchers(HttpMethod.POST, "/api/cms/hero/**").hasAnyRole("ADMIN", "GERENTE");
                    auth.requestMatchers(HttpMethod.DELETE, "/api/cms/hero/**").hasAnyRole("ADMIN", "GERENTE");
                    auth.requestMatchers(HttpMethod.PATCH, "/api/cms/hero/**").hasAnyRole("ADMIN", "GERENTE");

                    if (swaggerEnabled) {
                        auth.requestMatchers(
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/api-docs/**",
                                "/v3/api-docs/**"
                        ).permitAll();
                    }

                    auth.requestMatchers(HttpMethod.POST, "/api/checkout/**").authenticated();
                    auth.requestMatchers(HttpMethod.GET, "/api/orders/my").authenticated();
                    auth.requestMatchers(HttpMethod.GET, "/api/orders/*/payment-status").authenticated();
                    auth.requestMatchers(HttpMethod.POST, "/api/orders/*/pay/**").authenticated();
                    auth.requestMatchers(HttpMethod.POST, "/api/orders/*/cancel").authenticated();
                    auth.requestMatchers(HttpMethod.GET, "/api/orders/number/**").authenticated();
                    auth.requestMatchers(HttpMethod.GET, "/api/orders/*").authenticated();
                    auth.requestMatchers(HttpMethod.GET, "/api/orders").hasAnyRole("ADMIN", "GERENTE", "ESTOQUISTA");
                    auth.requestMatchers(HttpMethod.PATCH, "/api/orders/*/status").hasAnyRole("ADMIN", "GERENTE", "ESTOQUISTA");
                    auth.requestMatchers(HttpMethod.POST, "/api/products/**", "/api/categories/**").hasAnyRole("ADMIN", "GERENTE", "ESTOQUISTA");
                    auth.requestMatchers(HttpMethod.PUT, "/api/products/**", "/api/categories/**").hasAnyRole("ADMIN", "GERENTE", "ESTOQUISTA");
                    // Exclusão definitiva de produto: só ADMIN (antes da regra genérica de DELETE)
                    auth.requestMatchers(HttpMethod.DELETE, "/api/products/*/permanent").hasRole("ADMIN");
                    auth.requestMatchers(HttpMethod.DELETE, "/api/products/**", "/api/categories/**").hasAnyRole("ADMIN", "GERENTE", "ESTOQUISTA");
                    auth.requestMatchers(HttpMethod.PATCH, "/api/products/**", "/api/categories/**").hasAnyRole("ADMIN", "GERENTE", "ESTOQUISTA");
                    auth.requestMatchers("/api/admin/**").hasAnyRole("ADMIN", "GERENTE", "ESTOQUISTA");
                    auth.requestMatchers("/api/users/**").hasRole("ADMIN");
                    auth.anyRequest().authenticated();
                })
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(rateLimitFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    private boolean isSwaggerEnabled() {
        String appEnv = environment.getProperty("APP_ENV", "development").toLowerCase();
        if (appEnv.equals("production") || appEnv.equals("prod")) {
            return false;
        }
        return Boolean.parseBoolean(environment.getProperty("SWAGGER_ENABLED", "true"));
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        List<String> origins = Arrays.stream(atelieProperties.getCors().getAllowedOrigins().split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
        config.setAllowedOrigins(origins);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
