package com.ateliegg.controller;

import com.ateliegg.domain.enums.UserRole;
import com.ateliegg.dto.user.CreateUserRequest;
import com.ateliegg.dto.user.UserResponse;
import com.ateliegg.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "Usuários")
@SecurityRequirement(name = "Bearer Authentication")
public class UserController {

    private final UserService userService;

    @GetMapping
    @Operation(summary = "Listar usuários (ADMIN, pageable)")
    public Page<UserResponse> findAll(
            @PageableDefault(size = 25, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return userService.findAll(pageable);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar usuário por ID")
    public UserResponse findById(@PathVariable Long id) {
        return userService.findById(id);
    }

    @PostMapping
    @Operation(summary = "Criar usuário com papel definido")
    public UserResponse create(@Valid @RequestBody CreateUserRequest request) {
        return userService.create(request);
    }

    @PatchMapping("/{id}/role")
    @Operation(summary = "Atualizar papel do usuário")
    public UserResponse updateRole(@PathVariable Long id, @RequestParam UserRole role) {
        return userService.updateRole(id, role);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Desativar usuário")
    public void deactivate(@PathVariable Long id) {
        userService.deactivate(id);
    }
}
