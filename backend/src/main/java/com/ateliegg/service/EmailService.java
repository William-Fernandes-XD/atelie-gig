package com.ateliegg.service;

import com.ateliegg.config.AtelieProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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

    public void sendPasswordResetCode(String toEmail, String userName, String code) {
        if (!StringUtils.hasText(properties.getMail().getPassword())) {
            log.warn("================================================================");
            log.warn(" SMTP não configurado — código de recuperação de senha");
            log.warn(" Email: {}", toEmail);
            log.warn(" Código: {}", code);
            log.warn(" Configure MAIL_PASSWORD no .env para envio real por email.");
            log.warn("================================================================");
            return;
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(properties.getMail().getFrom());
        message.setTo(toEmail);
        message.setSubject("GIG — Código de recuperação de senha");
        message.setText("""
                Olá, %s!

                Recebemos uma solicitação para redefinir sua senha na GIG.

                Seu código de verificação é: %s

                Este código expira em 15 minutos.

                Se você não solicitou esta alteração, ignore este email.

                Atenciosamente,
                GIG — Moda Feminina
                """.formatted(userName, code));

        mailSender.send(message);
    }
}
