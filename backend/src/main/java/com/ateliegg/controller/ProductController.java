package com.ateliegg.controller;

import com.ateliegg.dto.product.ProductFilterOptionsResponse;
import com.ateliegg.dto.product.ProductRequest;
import com.ateliegg.dto.product.ProductResponse;
import com.ateliegg.dto.product.ProductSummaryResponse;
import com.ateliegg.service.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
@Tag(name = "Produtos")
public class ProductController {

    private final ProductService productService;

    @GetMapping
    @Operation(summary = "Listar produtos ativos (loja)")
    public Page<ProductSummaryResponse> findActive(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) List<Long> categoryIds,
            @RequestParam(required = false) List<String> colors,
            @RequestParam(required = false) List<String> sizes,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @PageableDefault(size = 25, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return productService.findActive(
                search, categoryId, categoryIds, colors, sizes, minPrice, maxPrice, pageable);
    }

    @GetMapping("/filters")
    @Operation(summary = "Opções de filtro da loja (categorias, cores, tamanhos)")
    public ProductFilterOptionsResponse getFilterOptions(
            @RequestParam(required = false) Long categoryId) {
        return productService.getFilterOptions(categoryId);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Detalhes do produto")
    public ProductResponse findById(@PathVariable Long id) {
        return productService.findById(id);
    }

    @GetMapping("/admin/all")
    @Operation(summary = "Listar todos os produtos (admin, pageable)")
    public Page<ProductResponse> findAllAdmin(
            @PageableDefault(size = 25, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return productService.findAllAdmin(pageable);
    }

    @PostMapping
    @Operation(summary = "Criar produto (admin)")
    public ProductResponse create(@Valid @RequestBody ProductRequest request) {
        return productService.create(request);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar produto (admin)")
    public ProductResponse update(@PathVariable Long id, @Valid @RequestBody ProductRequest request) {
        return productService.update(id, request);
    }

    @PostMapping("/{id}/image/main")
    @Operation(summary = "Upload imagem principal (admin)")
    public ProductResponse uploadMainImage(@PathVariable Long id, @RequestParam("file") MultipartFile file) {
        return productService.uploadMainImage(id, file);
    }

    @PostMapping("/{id}/image/gallery")
    @Operation(summary = "Adicionar imagem à galeria (admin)")
    public ProductResponse addGalleryImage(@PathVariable Long id, @RequestParam("file") MultipartFile file) {
        return productService.addGalleryImage(id, file);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Desativar produto (admin)")
    public void delete(@PathVariable Long id) {
        productService.delete(id);
    }

    @DeleteMapping("/{id}/permanent")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Excluir produto definitivamente (somente ADMIN)")
    public void permanentDelete(@PathVariable Long id) {
        productService.permanentDelete(id);
    }
}
