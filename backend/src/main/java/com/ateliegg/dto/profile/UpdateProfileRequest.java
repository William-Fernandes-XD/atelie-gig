package com.ateliegg.dto.profile;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateProfileRequest {

    @NotBlank
    @Size(max = 150)
    private String name;

    @Size(max = 20)
    private String phone;

    @Size(max = 14)
    private String cpf;

    @NotBlank
    @Size(max = 20)
    private String cep;

    @NotBlank
    @Size(max = 200)
    private String street;

    @NotBlank
    @Size(max = 20)
    private String number;

    @NotBlank
    @Size(max = 100)
    private String neighborhood;

    @NotBlank
    @Size(max = 100)
    private String city;

    @NotBlank
    @Size(min = 2, max = 2)
    private String state;

    @Size(max = 200)
    private String complement;

    @Size(max = 200)
    private String reference;
}
