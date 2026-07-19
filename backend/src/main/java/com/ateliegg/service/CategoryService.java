package com.ateliegg.service;

import com.ateliegg.domain.entity.Category;
import com.ateliegg.domain.entity.Product;
import com.ateliegg.dto.category.CategoryRequest;
import com.ateliegg.dto.category.CategoryResponse;
import com.ateliegg.exception.BusinessException;
import com.ateliegg.repository.CategoryRepository;
import com.ateliegg.repository.ProductRepository;
import com.ateliegg.util.SizeOptionsParser;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private static final String DEFAULT_CATEGORY_SLUG = "sem-categoria";

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    @Transactional(readOnly = true)
    public Page<CategoryResponse> findAll(Pageable pageable) {
        return categoryRepository.findAll(pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public CategoryResponse findById(Long id) {
        return toResponse(getCategory(id));
    }

    @Transactional
    public CategoryResponse create(CategoryRequest request) {
        if (categoryRepository.existsByName(request.getName())) {
            throw new BusinessException("Categoria já existe");
        }

        Category category = Category.builder()
                .name(request.getName())
                .description(request.getDescription())
                .slug(generateSlug(request.getName()))
                .sizeOptions(SizeOptionsParser.join(request.getSizeOptions()))
                .build();

        return toResponse(categoryRepository.save(category));
    }

    @Transactional
    public CategoryResponse update(Long id, CategoryRequest request) {
        Category category = getCategory(id);

        if (DEFAULT_CATEGORY_SLUG.equals(category.getSlug())) {
            throw new BusinessException("A categoria padrão não pode ser editada");
        }

        category.setName(request.getName());
        category.setDescription(request.getDescription());
        category.setSlug(generateSlug(request.getName()));
        category.setSizeOptions(SizeOptionsParser.join(request.getSizeOptions()));

        return toResponse(categoryRepository.save(category));
    }

    @Transactional
    public void delete(Long id) {
        Category category = getCategory(id);

        if (DEFAULT_CATEGORY_SLUG.equals(category.getSlug())) {
            throw new BusinessException("A categoria padrão não pode ser removida");
        }

        Category defaultCategory = categoryRepository.findBySlug(DEFAULT_CATEGORY_SLUG)
                .orElseThrow(() -> new BusinessException("Categoria padrão não encontrada", HttpStatus.INTERNAL_SERVER_ERROR));

        List<Product> products = productRepository.findByCategoryId(id);
        products.forEach(p -> p.setCategory(defaultCategory));
        productRepository.saveAll(products);

        categoryRepository.delete(category);
    }

    private Category getCategory(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Categoria não encontrada", HttpStatus.NOT_FOUND));
    }

    private String generateSlug(String name) {
        String normalized = Normalizer.normalize(name, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9\\s-]", "")
                .trim()
                .replaceAll("\\s+", "-");
        return normalized.isEmpty() ? "categoria" : normalized;
    }

    private CategoryResponse toResponse(Category category) {
        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .description(category.getDescription())
                .slug(category.getSlug())
                .sizeOptions(SizeOptionsParser.parse(category.getSizeOptions()))
                .createdAt(category.getCreatedAt())
                .build();
    }
}
