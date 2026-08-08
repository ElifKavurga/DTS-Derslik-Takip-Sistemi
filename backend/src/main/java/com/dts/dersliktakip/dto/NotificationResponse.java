package com.dts.dersliktakip.dto;

import java.time.Instant;
import java.util.UUID;

public record NotificationResponse(
        UUID id,
        String title,
        String message,
        String targetUrl,
        boolean read,
        Instant createdAt
) {
}
