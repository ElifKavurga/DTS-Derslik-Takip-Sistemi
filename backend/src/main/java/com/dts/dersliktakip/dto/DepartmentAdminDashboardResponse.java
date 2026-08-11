package com.dts.dersliktakip.dto;

import lombok.Builder;

import java.util.UUID;

@Builder
public record DepartmentAdminDashboardResponse(
        UUID departmentId,
        String departmentName,
        String departmentCode,
        UUID facultyId,
        String facultyName,
        long academicianCount,
        long courseCount
) {
}
