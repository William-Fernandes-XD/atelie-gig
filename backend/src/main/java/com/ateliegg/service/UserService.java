package com.ateliegg.service;

import com.ateliegg.domain.entity.User;
import com.ateliegg.domain.enums.UserRole;
import com.ateliegg.dto.user.CreateUserRequest;
import com.ateliegg.dto.user.UserResponse;
import com.ateliegg.exception.BusinessException;
import com.ateliegg.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public Page<UserResponse> findAll(Pageable pageable) {
        return userRepository.findAll(pageable).map(this::toResponse);
    }

    public UserResponse findById(Long id) {
        return toResponse(getUser(id));
    }

    @Transactional
    public UserResponse create(CreateUserRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException("Email já cadastrado");
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .phone(request.getPhone())
                .cpf(request.getCpf())
                .active(true)
                .build();

        return toResponse(userRepository.save(user));
    }

    @Transactional
    public UserResponse updateRole(Long id, UserRole role) {
        User user = getUser(id);
        user.setRole(role);
        return toResponse(userRepository.save(user));
    }

    @Transactional
    public void deactivate(Long id) {
        User user = getUser(id);
        if (user.getRole() == UserRole.ADMIN) {
            throw new BusinessException("Não é possível desativar o administrador");
        }
        user.setActive(false);
        userRepository.save(user);
    }

    private User getUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Usuário não encontrado", HttpStatus.NOT_FOUND));
    }

    private UserResponse toResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .phone(user.getPhone())
                .cpf(user.getCpf())
                .profilePhotoUrl(user.getProfilePhotoUrl())
                .active(user.getActive())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
