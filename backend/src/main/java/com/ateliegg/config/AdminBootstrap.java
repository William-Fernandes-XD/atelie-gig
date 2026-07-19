package com.ateliegg.config;

import com.ateliegg.domain.entity.User;
import com.ateliegg.domain.enums.UserRole;
import com.ateliegg.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.security.SecureRandom;
import java.util.Optional;

@Component
@RequiredArgsConstructor
@Slf4j
public class AdminBootstrap implements CommandLineRunner {

    private static final String UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private static final String LOWER = "abcdefghijklmnopqrstuvwxyz";
    private static final String DIGITS = "0123456789";
    private static final String SPECIAL = "!@#$%^&*()-_=+[]{}|;:,.<>?";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AtelieProperties properties;

    @Override
    public void run(String... args) {
        String adminEmail = properties.getAdmin().getEmail();
        Optional<User> existing = userRepository.findByEmail(adminEmail);

        if (existing.isPresent()) {
            if (properties.getAdmin().isResetPassword() && StringUtils.hasText(properties.getAdmin().getPassword())) {
                User admin = existing.get();
                admin.setPassword(passwordEncoder.encode(properties.getAdmin().getPassword()));
                userRepository.save(admin);
                log.warn(" Senha do administrador {} redefinida via ADMIN_RESET_PASSWORD.", adminEmail);
            }
            return;
        }

        String configuredPassword = properties.getAdmin().getPassword();
        boolean usingConfiguredPassword = StringUtils.hasText(configuredPassword);
        String plainPassword = usingConfiguredPassword ? configuredPassword : generateStrongPassword(48);

        User admin = User.builder()
                .name(properties.getAdmin().getName())
                .email(adminEmail)
                .password(passwordEncoder.encode(plainPassword))
                .role(UserRole.ADMIN)
                .active(true)
                .build();

        userRepository.save(admin);

        log.warn("================================================================");
        log.warn(" ADMINISTRADOR CRIADO");
        log.warn(" Email: {}", adminEmail);
        if (usingConfiguredPassword) {
            log.warn(" Senha: definida em ADMIN_PASSWORD no arquivo .env");
        } else {
            log.warn(" Senha: {}", plainPassword);
            log.warn(" Guarde esta senha em local seguro. Ela NÃO será exibida novamente.");
            log.warn(" Dica: defina ADMIN_PASSWORD no .env para usar uma senha fixa.");
        }
        log.warn("================================================================");
    }

    private String generateStrongPassword(int length) {
        String all = UPPER + LOWER + DIGITS + SPECIAL;
        SecureRandom random = new SecureRandom();
        StringBuilder password = new StringBuilder(length);

        password.append(UPPER.charAt(random.nextInt(UPPER.length())));
        password.append(LOWER.charAt(random.nextInt(LOWER.length())));
        password.append(DIGITS.charAt(random.nextInt(DIGITS.length())));
        password.append(SPECIAL.charAt(random.nextInt(SPECIAL.length())));

        for (int i = 4; i < length; i++) {
            password.append(all.charAt(random.nextInt(all.length())));
        }

        char[] chars = password.toString().toCharArray();
        for (int i = chars.length - 1; i > 0; i--) {
            int j = random.nextInt(i + 1);
            char tmp = chars[i];
            chars[i] = chars[j];
            chars[j] = tmp;
        }

        return new String(chars);
    }
}
