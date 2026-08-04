package com.ateliegg.dto.auth;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class MessageResponse {
    private String message;
    /** Só em desenvolvimento, quando o SMTP falha — nunca em production. */
    private String developmentCode;

    public MessageResponse(String message) {
        this(message, null);
    }
}
