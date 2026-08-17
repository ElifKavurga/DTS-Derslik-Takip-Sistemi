package com.dts.dersliktakip.dto;

import java.util.UUID;

public record PublicAcademicianResponse(
        UUID id,
        String firstName,
        String lastName,
        String title
) {
}
