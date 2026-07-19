package com.ateliegg.dto.category;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class CategoryResponse {
    private Long id;
    private String name;
    private String description;
    private String slug;
    private List<String> sizeOptions;
    private LocalDateTime createdAt;
}
