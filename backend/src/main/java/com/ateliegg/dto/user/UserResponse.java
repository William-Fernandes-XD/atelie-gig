package com.ateliegg.dto.user;

import com.ateliegg.domain.enums.UserRole;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class UserResponse {
    private Long id;
    private String name;
    private String email;
    private UserRole role;
    private String phone;
    private String cpf;
    private String profilePhotoUrl;
    private Boolean active;
    private LocalDateTime createdAt;
}
