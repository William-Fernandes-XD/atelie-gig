package com.ateliegg.dto.checkout;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.util.List;

@Data
public class CheckoutRequest {

    @NotEmpty
    @Valid
    private List<CheckoutItemRequest> items;

    private GuestInfo guest;

    private ShippingAddress shipping;

    /** Código do serviço Correios escolhido (ex.: 04510 = PAC, 04014 = SEDEX). */
    @NotBlank
    private String shippingServiceCode;

    @Data
    public static class GuestInfo {
        @NotBlank
        private String name;
        @NotBlank @Email
        private String email;
        @NotBlank
        private String phone;
        @NotBlank
        private String cpf;
    }

    @Data
    public static class ShippingAddress {
        @NotBlank
        private String cep;
        @NotBlank
        private String street;
        @NotBlank
        private String number;
        @NotBlank
        private String neighborhood;
        @NotBlank
        private String city;
        @NotBlank @Size(min = 2, max = 2)
        private String state;
        private String complement;
        private String reference;
    }
}
