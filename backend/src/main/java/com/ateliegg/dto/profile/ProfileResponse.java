package com.ateliegg.dto.profile;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ProfileResponse {
    private Long id;
    private String name;
    private String email;
    private String phone;
    private String cpf;
    private String profilePhotoUrl;
    private AddressDto address;
}
