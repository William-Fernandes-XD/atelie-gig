package com.ateliegg.service;

import com.ateliegg.domain.entity.Address;
import com.ateliegg.domain.entity.User;
import com.ateliegg.dto.profile.AddressDto;
import com.ateliegg.dto.profile.ProfileResponse;
import com.ateliegg.dto.profile.UpdateProfileRequest;
import com.ateliegg.exception.BusinessException;
import com.ateliegg.repository.AddressRepository;
import com.ateliegg.repository.UserRepository;
import com.ateliegg.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final SecurityUtils securityUtils;
    private final UserRepository userRepository;
    private final AddressRepository addressRepository;
    private final FileStorageService fileStorageService;

    @Transactional(readOnly = true)
    public ProfileResponse getProfile() {
        User user = securityUtils.getCurrentUser();
        return toResponse(user);
    }

    @Transactional
    public ProfileResponse updateProfile(UpdateProfileRequest request) {
        User user = securityUtils.getCurrentUser();
        user.setName(request.getName().trim());
        user.setPhone(normalizePhone(request.getPhone()));
        user.setCpf(normalizeCpf(request.getCpf()));

        Address address = addressRepository.findByUserIdAndIsDefaultTrue(user.getId())
                .orElseGet(() -> Address.builder().user(user).isDefault(true).build());

        address.setCep(normalizeCep(request.getCep()));
        address.setStreet(request.getStreet().trim());
        address.setNumber(request.getNumber().trim());
        address.setNeighborhood(request.getNeighborhood().trim());
        address.setCity(request.getCity().trim());
        address.setState(request.getState().trim().toUpperCase());
        address.setComplement(blankToNull(request.getComplement()));
        address.setReference(blankToNull(request.getReference()));
        address.setIsDefault(true);
        address.setUser(user);

        addressRepository.save(address);
        userRepository.save(user);
        return toResponse(user);
    }

    private String normalizeCep(String cep) {
        String digits = cep == null ? "" : cep.replaceAll("\\D", "");
        if (digits.length() != 8) {
            throw new BusinessException("CEP inválido. Use 8 dígitos.", HttpStatus.BAD_REQUEST);
        }
        return digits.substring(0, 5) + "-" + digits.substring(5);
    }

    private String normalizeCpf(String cpf) {
        if (cpf == null || cpf.isBlank()) {
            return null;
        }
        String digits = cpf.replaceAll("\\D", "");
        if (digits.length() != 11) {
            throw new BusinessException("CPF inválido. Use 11 dígitos.", HttpStatus.BAD_REQUEST);
        }
        return digits.substring(0, 3) + "." + digits.substring(3, 6) + "."
                + digits.substring(6, 9) + "-" + digits.substring(9);
    }

    private String normalizePhone(String phone) {
        if (phone == null || phone.isBlank()) {
            return null;
        }
        return phone.trim();
    }

    private String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    @Transactional
    public ProfileResponse updatePhoto(MultipartFile photo) {
        User user = securityUtils.getCurrentUser();
        String photoUrl = fileStorageService.storeUserPhoto(photo, user.getId());
        user.setProfilePhotoUrl(photoUrl);
        userRepository.save(user);
        return toResponse(user);
    }

    private ProfileResponse toResponse(User user) {
        AddressDto addressDto = addressRepository.findByUserIdAndIsDefaultTrue(user.getId())
                .map(this::toAddressDto)
                .orElse(null);

        return ProfileResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .cpf(user.getCpf())
                .profilePhotoUrl(user.getProfilePhotoUrl())
                .address(addressDto)
                .build();
    }

    private AddressDto toAddressDto(Address address) {
        return AddressDto.builder()
                .id(address.getId())
                .cep(address.getCep())
                .street(address.getStreet())
                .number(address.getNumber())
                .neighborhood(address.getNeighborhood())
                .city(address.getCity())
                .state(address.getState())
                .complement(address.getComplement())
                .reference(address.getReference())
                .isDefault(address.getIsDefault())
                .build();
    }
}
