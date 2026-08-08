package com.dts.dersliktakip.dto;

import java.util.UUID;

public record AcademicianResponse(
        UUID id,
        String firstName,
        String lastName,
        String email,
        String phone,
        String title,
        UUID facultyId,
        String facultyName,
        UUID departmentId,
        String departmentName
) {
}
