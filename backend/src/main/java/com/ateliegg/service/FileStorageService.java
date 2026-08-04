package com.ateliegg.service;

import com.ateliegg.config.AtelieProperties;
import com.ateliegg.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FileStorageService {

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp"
    );

    private static final Map<String, String> EXTENSION_BY_TYPE = Map.of(
            "image/jpeg", ".jpg",
            "image/jpg", ".jpg",
            "image/png", ".png",
            "image/webp", ".webp"
    );

    private final AtelieProperties properties;

    public String storeProductImage(MultipartFile file, Long productId) {
        ImageMeta meta = validateImage(file);
        return storeImage(file, "products", String.valueOf(productId), meta.extension());
    }

    public String storeUserPhoto(MultipartFile file, Long userId) {
        ImageMeta meta = validateImage(file);
        return storeImage(file, "users", String.valueOf(userId), meta.extension());
    }

    /** Pasta uploads/hero/{kind} — kind: main | logo | background */
    public String storeHeroImage(MultipartFile file, String kind) {
        ImageMeta meta = validateImage(file);
        String safeKind = (kind == null || kind.isBlank()) ? "main" : kind.trim().toLowerCase(Locale.ROOT);
        return storeImage(file, "hero", safeKind, meta.extension());
    }

    public void deleteIfExists(String publicUrl) {
        if (publicUrl == null || !publicUrl.startsWith("/uploads/")) {
            return;
        }
        try {
            Path root = Paths.get(properties.getUpload().getDir()).toAbsolutePath().normalize();
            String relative = publicUrl.substring("/uploads/".length());
            Path target = root.resolve(relative).normalize();
            if (!target.startsWith(root)) {
                return;
            }
            Files.deleteIfExists(target);
        } catch (IOException ignored) {
            // best-effort cleanup
        }
    }

    private String storeImage(MultipartFile file, String folder, String subFolder, String extension) {
        try {
            Path uploadDir = Paths.get(properties.getUpload().getDir(), folder, subFolder)
                    .toAbsolutePath()
                    .normalize();
            Files.createDirectories(uploadDir);

            String filename = UUID.randomUUID() + extension;
            Path target = uploadDir.resolve(filename);

            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

            return "/uploads/" + folder + "/" + subFolder + "/" + filename;
        } catch (IOException e) {
            throw new BusinessException("Erro ao salvar imagem", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private ImageMeta validateImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException("Arquivo de imagem é obrigatório");
        }

        String contentType = file.getContentType();
        if (contentType == null) {
            throw new BusinessException("Apenas JPEG, PNG ou WebP são permitidos");
        }
        contentType = contentType.toLowerCase(Locale.ROOT).trim();
        if (!ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new BusinessException("Apenas JPEG, PNG ou WebP são permitidos (SVG e outros formatos bloqueados)");
        }

        String original = file.getOriginalFilename();
        if (original != null) {
            String lower = original.toLowerCase(Locale.ROOT);
            if (lower.endsWith(".svg") || lower.endsWith(".svgz") || lower.endsWith(".html") || lower.endsWith(".htm")) {
                throw new BusinessException("Tipo de arquivo não permitido");
            }
        }

        byte[] header = readHeader(file, 12);
        String detected = detectImageType(header);
        if (detected == null) {
            throw new BusinessException("Arquivo inválido: conteúdo não é JPEG, PNG ou WebP");
        }
        if (!contentTypeCompatible(contentType, detected)) {
            throw new BusinessException("Tipo do arquivo não confere com o conteúdo");
        }

        return new ImageMeta(EXTENSION_BY_TYPE.getOrDefault(detected, ".jpg"));
    }

    private static boolean contentTypeCompatible(String contentType, String detected) {
        if ("image/jpg".equals(contentType)) {
            contentType = "image/jpeg";
        }
        return contentType.equals(detected);
    }

    private static byte[] readHeader(MultipartFile file, int size) {
        try (InputStream in = file.getInputStream()) {
            return in.readNBytes(size);
        } catch (IOException e) {
            throw new BusinessException("Não foi possível ler o arquivo", HttpStatus.BAD_REQUEST);
        }
    }

    /** Detecta tipo real pelos magic bytes (protege contra renomear .svg para .jpg). */
    private static String detectImageType(byte[] header) {
        if (header == null || header.length < 3) {
            return null;
        }
        // JPEG: FF D8 FF
        if ((header[0] & 0xFF) == 0xFF && (header[1] & 0xFF) == 0xD8 && (header[2] & 0xFF) == 0xFF) {
            return "image/jpeg";
        }
        // PNG: 89 50 4E 47
        if (header.length >= 8
                && (header[0] & 0xFF) == 0x89
                && header[1] == 0x50
                && header[2] == 0x4E
                && header[3] == 0x47) {
            return "image/png";
        }
        // WebP: RIFF....WEBP
        if (header.length >= 12
                && header[0] == 'R'
                && header[1] == 'I'
                && header[2] == 'F'
                && header[3] == 'F'
                && header[8] == 'W'
                && header[9] == 'E'
                && header[10] == 'B'
                && header[11] == 'P') {
            return "image/webp";
        }
        return null;
    }

    private record ImageMeta(String extension) {}
}
