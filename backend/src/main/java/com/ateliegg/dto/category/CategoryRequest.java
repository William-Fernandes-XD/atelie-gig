package com.ateliegg.dto.category;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

@Data
public class CategoryRequest {
    @NotBlank
    private String name;
    private String description;
    /** Ex.: ["40-48"] — cadastrado no admin da categoria */
    private List<String> sizeOptions;
}
