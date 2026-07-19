package com.ateliegg.dto.auth;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class GoogleConfigResponse {
    private String clientId;
    private boolean enabled;
}
