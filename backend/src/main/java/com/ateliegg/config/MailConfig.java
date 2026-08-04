package com.ateliegg.config;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.util.StringUtils;

import java.util.Properties;

/**
 * Monta o JavaMailSender direto das variáveis do .env (AtelieProperties),
 * evitando divergência com spring.mail.* e limpando \\r do Windows.
 */
@Configuration
@RequiredArgsConstructor
@Slf4j
public class MailConfig {

    private final AtelieProperties properties;

    @Bean
    public JavaMailSender javaMailSender() {
        AtelieProperties.Mail mail = properties.getMail();
        JavaMailSenderImpl sender = new JavaMailSenderImpl();

        String host = trim(mail.getHost());
        if (!StringUtils.hasText(host)) {
            host = "smtp.gmail.com";
        }
        int port = mail.getPort() > 0 ? mail.getPort() : 587;
        String username = trim(mail.getUsername());
        String password = trim(mail.getPassword());

        sender.setHost(host);
        sender.setPort(port);
        sender.setUsername(username);
        sender.setPassword(password);
        sender.setDefaultEncoding("UTF-8");

        Properties props = sender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.smtp.starttls.required", "true");
        props.put("mail.smtp.connectiontimeout", "10000");
        props.put("mail.smtp.timeout", "10000");
        props.put("mail.smtp.writetimeout", "10000");
        if (port == 465) {
            props.put("mail.smtp.ssl.enable", "true");
            props.put("mail.smtp.socketFactory.port", "465");
            props.put("mail.smtp.socketFactory.class", "javax.net.ssl.SSLSocketFactory");
        }

        return sender;
    }

    @PostConstruct
    void logMailStatus() {
        AtelieProperties.Mail mail = properties.getMail();
        String user = trim(mail.getUsername());
        String pass = trim(mail.getPassword());
        if (!StringUtils.hasText(user) || !StringUtils.hasText(pass)) {
            log.warn("E-mail SMTP incompleto (MAIL_USERNAME/MAIL_PASSWORD). Recuperação de senha ficará indisponível.");
            return;
        }
        log.info("E-mail SMTP pronto: host={} port={} user={} passLen={}",
                trim(mail.getHost()),
                mail.getPort() > 0 ? mail.getPort() : 587,
                user,
                pass.length());
    }

    private static String trim(String value) {
        if (value == null) {
            return "";
        }
        // Remove espaços e CR/LF que o .env do Windows às vezes cola no valor
        return value.replace("\r", "").replace("\n", "").trim();
    }
}
