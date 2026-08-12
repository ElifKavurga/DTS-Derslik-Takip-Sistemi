package com.dts.dersliktakip.dto;

import java.time.Instant;
import java.util.List;

public record ApiErrorResponse(
        Instant timestamp,
        int status,
        String error,
        String message,
        String path,
        List<FieldErrorResponse> fieldErrors,
        String code,
        List<String> details
) {
    public ApiErrorResponse(
            Instant timestamp,
            int status,
            String error,
            String message,
            String path,
            List<FieldErrorResponse> fieldErrors
    ) {
        this(timestamp, status, error, message, path, fieldErrors, null, List.of());
    }

    public ApiErrorResponse {
        fieldErrors = fieldErrors == null ? List.of() : fieldErrors;
        details = details == null ? List.of() : details;
    }
}
