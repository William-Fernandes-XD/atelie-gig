package com.ateliegg.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ResetPasswordRequest {
    @NotBlank @Email
    private String email;

    @NotBlank
    @Pattern(regexp = "^\\d{6}$", message = "O código deve conter 6 dígitos")
    private String code;

    @NotBlank @Size(min = 8, max = 100)
    private String newPassword;
}
