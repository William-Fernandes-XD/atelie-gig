package com.ateliegg.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpServletResponseWrapper;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Cache HTTP no navegador para catálogo público (economiza banco).
 * Detalhe de produto (tem estoque) e rotas autenticadas: sem cache.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 30)
public class PublicCacheHeadersFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        if (HttpMethod.GET.matches(request.getMethod())) {
            String path = request.getRequestURI();
            if (isCatalogList(path)) {
                // 2 min no navegador; pode revalidar depois
                response.setHeader("Cache-Control", "public, max-age=120, stale-while-revalidate=60");
            } else if (isProductDetail(path)) {
                // Estoque muda rápido — não cachear no HTTP
                response.setHeader("Cache-Control", "no-store");
            } else if (path.startsWith("/uploads/")) {
                response.setHeader("Cache-Control", "public, max-age=86400, immutable");
                String imageType = imageContentType(path);
                if (imageType != null) {
                    // Força image/* mesmo se o container Java omitir MIME (com nosniff no nginx)
                    HttpServletResponse wrapped = new HttpServletResponseWrapper(response) {
                        @Override
                        public void setContentType(String type) {
                            super.setContentType(imageType);
                        }

                        @Override
                        public void setHeader(String name, String value) {
                            if ("Content-Type".equalsIgnoreCase(name)) {
                                super.setHeader(name, imageType);
                            } else {
                                super.setHeader(name, value);
                            }
                        }
                    };
                    wrapped.setContentType(imageType);
                    filterChain.doFilter(request, wrapped);
                    return;
                }
            }
        }
        filterChain.doFilter(request, response);
    }

    private static String imageContentType(String path) {
        String lower = path.toLowerCase();
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
            return "image/jpeg";
        }
        if (lower.endsWith(".png")) {
            return "image/png";
        }
        if (lower.endsWith(".webp")) {
            return "image/webp";
        }
        return null;
    }

    private boolean isCatalogList(String path) {
        return "/api/products".equals(path)
                || "/api/products/filters".equals(path)
                || "/api/categories".equals(path);
    }

    private boolean isProductDetail(String path) {
        // /api/products/123 — não admin
        if (!path.startsWith("/api/products/")) {
            return false;
        }
        if (path.startsWith("/api/products/admin") || path.startsWith("/api/products/filters")) {
            return false;
        }
        String rest = path.substring("/api/products/".length());
        return !rest.isEmpty() && rest.chars().allMatch(Character::isDigit);
    }
}
