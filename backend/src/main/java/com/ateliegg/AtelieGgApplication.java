package com.ateliegg;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableScheduling;
import com.ateliegg.config.AtelieProperties;

@SpringBootApplication
@EnableConfigurationProperties(AtelieProperties.class)
@EnableScheduling
public class AtelieGgApplication {

    public static void main(String[] args) {
        SpringApplication.run(AtelieGgApplication.class, args);
    }
}
