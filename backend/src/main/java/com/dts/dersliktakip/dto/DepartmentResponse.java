package com.dts.dersliktakip.dto;

import java.util.UUID;

public record DepartmentResponse(
        UUID id,
        String name,
        String code,
        UUID facultyId,
        String facultyName,
        long academicianCount,
        long courseCount
) {
}
