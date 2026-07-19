package com.ateliegg.service;

import com.ateliegg.domain.entity.*;
import com.ateliegg.dto.product.ProductFilterOptionsResponse;
import com.ateliegg.dto.product.ProductRequest;
import com.ateliegg.dto.product.ProductResponse;
import com.ateliegg.dto.product.ProductSummaryResponse;
import com.ateliegg.exception.BusinessException;
import com.ateliegg.repository.CategoryRepository;
import com.ateliegg.repository.ProductColorRepository;
import com.ateliegg.repository.ProductRepository;
import com.ateliegg.repository.ProductSizeRepository;
import com.ateliegg.repository.StockRepository;
import com.ateliegg.util.SizeOptionsParser;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService {

    @PersistenceContext
    private EntityManager entityManager;

    private final ProductRepository productRepository;
    private final ProductColorRepository productColorRepository;
    private final ProductSizeRepository productSizeRepository;
    private final CategoryRepository categoryRepository;
    private final StockRepository stockRepository;
    private final FileStorageService fileStorageService;

    @Transactional(readOnly = true)
    public Page<ProductSummaryResponse> findActive(
            String search,
            Long categoryId,
            List<Long> categoryIds,
            List<String> colors,
            List<String> sizes,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            Pageable pageable) {
        String normalizedSearch = search != null && !search.isBlank() ? search.trim() : "";
        List<Long> resolvedCategoryIds = resolveCategoryIds(categoryId, categoryIds);
        List<String> colorNames = normalizeFilterList(colors);
        List<String> sizeNames = normalizeFilterList(sizes);

        Page<Product> page = productRepository.findActiveFiltered(
                normalizedSearch,
                resolvedCategoryIds,
                colorNames,
                sizeNames,
                minPrice,
                maxPrice,
                pageable);

        return page.map(this::toSummary);
    }

    @Transactional(readOnly = true)
    public ProductFilterOptionsResponse getFilterOptions(Long categoryId) {
        Long categoryFilter = categoryId != null ? categoryId : -1L;

        List<ProductFilterOptionsResponse.CategoryOption> categories = productRepository
                .findDistinctActiveCategories()
                .stream()
                .filter(c -> !"sem-categoria".equals(c.getSlug()))
                .map(c -> ProductFilterOptionsResponse.CategoryOption.builder()
                        .id(c.getId())
                        .name(c.getName())
                        .build())
                .toList();

        List<Object[]> priceRows = productRepository.findActivePriceRange(categoryFilter);
        Object[] priceRange = priceRows.isEmpty() ? new Object[] { null, null } : priceRows.get(0);
        BigDecimal minPrice = toBigDecimal(priceRange[0]);
        BigDecimal maxPrice = toBigDecimal(priceRange[1]);

        // Tamanhos reais dos produtos ativos (o filtro precisa bater com product_sizes.name)
        List<String> sizes = productSizeRepository.findDistinctNamesByActiveProducts(categoryFilter);
        if (sizes.isEmpty() && categoryId != null) {
            sizes = categoryRepository.findById(categoryId)
                    .map(c -> SizeOptionsParser.parse(c.getSizeOptions()))
                    .orElse(List.of());
        }
        if (sizes.isEmpty()) {
            sizes = categoryRepository.findAll().stream()
                    .filter(c -> !"sem-categoria".equals(c.getSlug()))
                    .flatMap(c -> SizeOptionsParser.parse(c.getSizeOptions()).stream())
                    .distinct()
                    .sorted()
                    .toList();
        }

        return ProductFilterOptionsResponse.builder()
                .categories(categories)
                .colors(productColorRepository.findDistinctNamesByActiveProducts(categoryFilter))
                .sizes(sizes)
                .minPrice(minPrice)
                .maxPrice(maxPrice)
                .build();
    }

    private List<Long> resolveCategoryIds(Long categoryId, List<Long> categoryIds) {
        if (categoryIds != null && !categoryIds.isEmpty()) {
            return categoryIds;
        }
        if (categoryId != null) {
            return List.of(categoryId);
        }
        return null;
    }

    private List<String> normalizeFilterList(List<String> values) {
        if (values == null || values.isEmpty()) {
            return null;
        }
        List<String> normalized = values.stream()
                .filter(v -> v != null && !v.isBlank())
                .map(String::trim)
                .distinct()
                .toList();
        return normalized.isEmpty() ? null : normalized;
    }

    private BigDecimal toBigDecimal(Object value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        if (value instanceof BigDecimal bd) {
            return bd;
        }
        if (value instanceof Number number) {
            return BigDecimal.valueOf(number.doubleValue());
        }
        return new BigDecimal(value.toString());
    }

    @Transactional(readOnly = true)
    public ProductResponse findById(Long id) {
        return toDetail(getProduct(id));
    }

    @Transactional(readOnly = true)
    public Page<ProductResponse> findAllAdmin(Pageable pageable) {
        return productRepository.findAll(pageable).map(this::toDetail);
    }

    @Transactional
    public ProductResponse create(ProductRequest request) {
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new BusinessException("Categoria não encontrada", HttpStatus.NOT_FOUND));

        Product product = Product.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .category(category)
                .price(request.getPrice())
                .wholesalePrice(request.getWholesalePrice())
                .active(request.getActive() != null ? request.getActive() : true)
                .build();

        product = productRepository.save(product);
        applyProductDetails(product, request);
        product = productRepository.save(product);

        return toDetail(product);
    }

    @Transactional
    public ProductResponse update(Long id, ProductRequest request) {
        Product product = getProduct(id);

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new BusinessException("Categoria não encontrada", HttpStatus.NOT_FOUND));

        product.setTitle(request.getTitle());
        product.setDescription(request.getDescription());
        product.setCategory(category);
        product.setPrice(request.getPrice());
        product.setWholesalePrice(request.getWholesalePrice());
        if (request.getActive() != null) {
            product.setActive(request.getActive());
        }

        replaceProductDetails(product, request);

        return toDetail(productRepository.save(product));
    }

    private void replaceProductDetails(Product product, ProductRequest request) {
        Long productId = product.getId();

        entityManager.createQuery("DELETE FROM Stock s WHERE s.product.id = :productId")
                .setParameter("productId", productId)
                .executeUpdate();
        entityManager.createQuery("DELETE FROM ProductSpecification s WHERE s.product.id = :productId")
                .setParameter("productId", productId)
                .executeUpdate();
        entityManager.createQuery("DELETE FROM ProductColor c WHERE c.product.id = :productId")
                .setParameter("productId", productId)
                .executeUpdate();
        entityManager.createQuery("DELETE FROM ProductSize s WHERE s.product.id = :productId")
                .setParameter("productId", productId)
                .executeUpdate();
        entityManager.flush();

        product.getStockItems().clear();
        product.getSpecifications().clear();
        product.getColors().clear();
        product.getSizes().clear();
        entityManager.refresh(product);

        applyProductDetails(product, request);
    }

    @Transactional
    public ProductResponse uploadMainImage(Long id, MultipartFile file) {
        Product product = getProduct(id);
        String url = fileStorageService.storeProductImage(file, id);
        product.setMainImageUrl(url);
        return toDetail(productRepository.save(product));
    }

    @Transactional
    public ProductResponse addGalleryImage(Long id, MultipartFile file) {
        Product product = getProduct(id);
        String url = fileStorageService.storeProductImage(file, id);

        ProductImage image = ProductImage.builder()
                .product(product)
                .imageUrl(url)
                .displayOrder(product.getGalleryImages().size())
                .build();

        product.getGalleryImages().add(image);
        return toDetail(productRepository.save(product));
    }

    @Transactional
    public void delete(Long id) {
        Product product = getProduct(id);
        product.setActive(false);
        productRepository.save(product);
    }

    private void applyProductDetails(Product product, ProductRequest request) {
        Map<String, ProductColor> colorMap = new LinkedHashMap<>();
        for (ProductRequest.ColorRequest cr : request.getColors()) {
            if (cr.getName() == null || cr.getName().isBlank()) {
                continue;
            }
            String colorName = cr.getName().trim();
            if (colorMap.containsKey(colorName)) {
                continue;
            }
            ProductColor color = ProductColor.builder()
                    .product(product)
                    .name(colorName)
                    .hexCode(cr.getHexCode())
                    .build();
            product.getColors().add(color);
            colorMap.put(colorName, color);
        }

        if (colorMap.isEmpty()) {
            throw new BusinessException("Adicione pelo menos uma cor ao produto.");
        }

        Map<String, ProductSize> sizeMap = new LinkedHashMap<>();
        for (String sizeName : request.getSizes()) {
            if (sizeName == null || sizeName.isBlank()) {
                continue;
            }
            String normalizedSize = sizeName.trim();
            if (sizeMap.containsKey(normalizedSize)) {
                continue;
            }
            ProductSize size = ProductSize.builder()
                    .product(product)
                    .name(normalizedSize)
                    .build();
            product.getSizes().add(size);
            sizeMap.put(normalizedSize, size);
        }

        if (sizeMap.isEmpty()) {
            throw new BusinessException("Adicione pelo menos um tamanho ao produto.");
        }

        for (ProductRequest.SpecificationRequest spec : request.getSpecifications()) {
            product.getSpecifications().add(ProductSpecification.builder()
                    .product(product)
                    .specKey(spec.getKey())
                    .specValue(spec.getValue())
                    .build());
        }

        for (ProductRequest.StockRequest sr : request.getStock()) {
            ProductColor color = colorMap.get(sr.getColorName());
            ProductSize size = sizeMap.get(sr.getSizeName());
            if (color == null || size == null) {
                throw new BusinessException("Cor ou tamanho inválido no estoque: " + sr.getColorName() + " / " + sr.getSizeName());
            }
            product.getStockItems().add(Stock.builder()
                    .product(product)
                    .color(color)
                    .size(size)
                    .quantity(sr.getQuantity() != null ? sr.getQuantity() : 0)
                    .build());
        }
    }

    private Product getProduct(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Produto não encontrado", HttpStatus.NOT_FOUND));
    }

    private ProductSummaryResponse toSummary(Product product) {
        return ProductSummaryResponse.builder()
                .id(product.getId())
                .title(product.getTitle())
                .price(product.getPrice())
                .wholesalePrice(product.getWholesalePrice())
                .mainImageUrl(product.getMainImageUrl())
                .categoryName(product.getCategory().getName())
                .build();
    }

    private ProductResponse toDetail(Product product) {
        return ProductResponse.builder()
                .id(product.getId())
                .title(product.getTitle())
                .description(product.getDescription())
                .categoryId(product.getCategory().getId())
                .categoryName(product.getCategory().getName())
                .price(product.getPrice())
                .wholesalePrice(product.getWholesalePrice())
                .mainImageUrl(product.getMainImageUrl())
                .active(product.getActive())
                .colors(product.getColors().stream()
                        .map(c -> ProductResponse.ColorResponse.builder()
                                .id(c.getId())
                                .name(c.getName())
                                .hexCode(c.getHexCode())
                                .build())
                        .toList())
                .sizes(product.getSizes().stream().map(ProductSize::getName).toList())
                .specifications(product.getSpecifications().stream()
                        .map(s -> Map.of(s.getSpecKey(), s.getSpecValue()))
                        .collect(Collectors.toList()))
                .galleryImages(product.getGalleryImages().stream()
                        .map(ProductImage::getImageUrl)
                        .toList())
                .stock(product.getStockItems().stream()
                        .map(s -> ProductResponse.StockResponse.builder()
                                .id(s.getId())
                                .colorId(s.getColor().getId())
                                .colorName(s.getColor().getName())
                                .sizeId(s.getSize().getId())
                                .sizeName(s.getSize().getName())
                                .quantity(s.getQuantity())
                                .build())
                        .toList())
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .build();
    }
}
