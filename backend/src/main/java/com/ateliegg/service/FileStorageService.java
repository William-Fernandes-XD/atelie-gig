package com.ateliegg.service;

import com.ateliegg.config.AtelieProperties;
import com.ateliegg.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FileStorageService {

    private final AtelieProperties properties;

    public String storeProductImage(MultipartFile file, Long productId) {
        validateImage(file);
        return storeImage(file, "products", String.valueOf(productId));
    }

    public String storeUserPhoto(MultipartFile file, Long userId) {
        validateImage(file);
        return storeImage(file, "users", String.valueOf(userId));
    }

    private String storeImage(MultipartFile file, String folder, String subFolder) {
        try {
            Path uploadDir = Paths.get(properties.getUpload().getDir(), folder, subFolder)
                    .toAbsolutePath()
                    .normalize();
            Files.createDirectories(uploadDir);

            String extension = getExtension(file.getOriginalFilename());
            String filename = UUID.randomUUID() + extension;
            Path target = uploadDir.resolve(filename);

            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

            return "/uploads/" + folder + "/" + subFolder + "/" + filename;
        } catch (IOException e) {
            throw new BusinessException("Erro ao salvar imagem: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private void validateImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException("Arquivo de imagem é obrigatório");
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new BusinessException("Apenas arquivos de imagem são permitidos");
        }
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return ".jpg";
        }
        return filename.substring(filename.lastIndexOf('.'));
    }
}
