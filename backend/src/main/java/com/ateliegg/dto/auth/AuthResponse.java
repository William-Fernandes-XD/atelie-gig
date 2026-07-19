package com.ateliegg.dto.auth;

import com.ateliegg.domain.enums.UserRole;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AuthResponse {
    private String token;
    private Long userId;
    private String name;
    private String email;
    private UserRole role;
    private String profilePhotoUrl;
}
