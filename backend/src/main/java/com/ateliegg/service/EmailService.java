package com.ateliegg.service;

import com.ateliegg.config.AtelieProperties;
import com.ateliegg.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;
    private final AtelieProperties properties;
    private final Environment environment;

    public void sendPasswordResetCode(String toEmail, String userName, String code) {
        String username = clean(properties.getMail().getUsername());
        String password = clean(properties.getMail().getPassword());

        if (!StringUtils.hasText(username) || !StringUtils.hasText(password)) {
            logDevFallback(toEmail, code, "MAIL_USERNAME/MAIL_PASSWORD não configurados");
            throw userFacingMailError();
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(username);
        message.setTo(toEmail);
        message.setSubject("GIG - Codigo de recuperacao de senha");
        message.setText("""
                Ola, %s!

                Recebemos uma solicitacao para redefinir sua senha na GIG.

                Seu codigo de verificacao e: %s

                Este codigo expira em 15 minutos.

                Se voce nao solicitou esta alteracao, ignore este email.

                Atenciosamente,
                GIG - Moda Feminina
                """.formatted(userName != null ? userName : "cliente", code));

        try {
            mailSender.send(message);
            log.info("E-mail de recuperação enviado para {}", toEmail);
        } catch (MailException ex) {
            log.error("Falha SMTP ao enviar recuperação para {} (conta {}): {}",
                    toEmail, username, ex.getMessage());
            logDevFallback(toEmail, code, "Falha SMTP — detalhes só no log do servidor");
            throw userFacingMailError();
        }
    }

    private static BusinessException userFacingMailError() {
        return new BusinessException(
                "Não foi possível enviar o e-mail no momento. Tente novamente em alguns minutos.",
                HttpStatus.SERVICE_UNAVAILABLE);
    }

    private void logDevFallback(String toEmail, String code, String reason) {
        if (isProduction()) {
            return;
        }
        log.warn("================================================================");
        log.warn(" Recuperação de senha — e-mail NÃO enviado ({})", reason);
        log.warn(" Destino: {}", toEmail);
        log.warn(" Código (só em desenvolvimento): {}", code);
        log.warn("================================================================");
    }

    private boolean isProduction() {
        return "production".equalsIgnoreCase(environment.getProperty("APP_ENV", "development"));
    }

    private static String clean(String value) {
        if (value == null) {
            return "";
        }
        return value.replace("\r", "").replace("\n", "").trim();
    }
}
