package com.dts.dersliktakip.dto;

import com.dts.dersliktakip.entity.Semester;
import lombok.Builder;

import java.util.List;
import java.util.UUID;

@Builder
public record DepartmentAdminDashboardResponse(
        UUID departmentId,
        String departmentName,
        String departmentCode,
        UUID facultyId,
        String facultyName,
        long academicianCount,
        long courseCount,
        Semester semester,
        UUID academicPeriodId,
        String academicPeriodDisplayName,
        long classroomCount,
        ScheduleCompletionResponse scheduleSummary,
        List<String> warnings
) {
}
