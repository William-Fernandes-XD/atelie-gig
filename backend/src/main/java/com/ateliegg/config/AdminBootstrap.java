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
import java.util.List;
import java.util.Locale;
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
        if (!StringUtils.hasText(adminEmail)) {
            log.warn("ADMIN_EMAIL vazio — pulando bootstrap do administrador.");
            return;
        }
        adminEmail = adminEmail.trim().toLowerCase(Locale.ROOT);

        List<User> admins = userRepository.findByRole(UserRole.ADMIN);
        Optional<User> byNewEmail = userRepository.findByEmail(adminEmail);

        // Já existe admin com o e-mail configurado
        if (byNewEmail.isPresent() && byNewEmail.get().getRole() == UserRole.ADMIN) {
            maybeResetPassword(byNewEmail.get(), adminEmail);
            return;
        }

        // Existe admin com e-mail antigo → migra para ADMIN_EMAIL
        if (!admins.isEmpty()) {
            User admin = admins.get(0);

            if (byNewEmail.isPresent() && !byNewEmail.get().getId().equals(admin.getId())) {
                // O e-mail novo já está em outra conta (ex.: cliente). Promove essa conta a ADMIN
                // e rebaixa o admin antigo para CLIENTE, para não perder o login.
                User target = byNewEmail.get();
                String oldAdminEmail = admin.getEmail();
                admin.setRole(UserRole.CLIENTE);
                userRepository.save(admin);

                target.setRole(UserRole.ADMIN);
                if (StringUtils.hasText(properties.getAdmin().getName())) {
                    target.setName(properties.getAdmin().getName());
                }
                maybeResetPassword(target, adminEmail);
                userRepository.save(target);
                log.warn(" Admin transferido para {} (conta anterior {} virou CLIENTE).", adminEmail, oldAdminEmail);
                return;
            }

            String oldEmail = admin.getEmail();
            if (!adminEmail.equalsIgnoreCase(oldEmail)) {
                admin.setEmail(adminEmail);
                if (StringUtils.hasText(properties.getAdmin().getName())) {
                    admin.setName(properties.getAdmin().getName());
                }
                maybeResetPassword(admin, adminEmail);
                userRepository.save(admin);
                log.warn(" E-mail do administrador atualizado: {} → {}", oldEmail, adminEmail);
                return;
            }

            maybeResetPassword(admin, adminEmail);
            return;
        }

        // Nenhum admin ainda → cria
        if (byNewEmail.isPresent()) {
            User user = byNewEmail.get();
            user.setRole(UserRole.ADMIN);
            if (StringUtils.hasText(properties.getAdmin().getName())) {
                user.setName(properties.getAdmin().getName());
            }
            maybeResetPassword(user, adminEmail);
            userRepository.save(user);
            log.warn(" Conta {} promovida a ADMINISTRADOR.", adminEmail);
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

    private void maybeResetPassword(User admin, String adminEmail) {
        if (properties.getAdmin().isResetPassword() && StringUtils.hasText(properties.getAdmin().getPassword())) {
            admin.setPassword(passwordEncoder.encode(properties.getAdmin().getPassword()));
            userRepository.save(admin);
            log.warn(" Senha do administrador {} redefinida via ADMIN_RESET_PASSWORD.", adminEmail);
        }
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
