package com.dts.dersliktakip.dto;

import com.dts.dersliktakip.entity.CourseType;
import com.dts.dersliktakip.entity.Semester;

import java.util.UUID;

public record CourseResponse(
        UUID id,
        String code,
        String name,
        UUID facultyId,
        String facultyName,
        UUID departmentId,
        String departmentName,
        UUID academicianId,
        String academicianName,
        int theoreticalHours,
        int practicalHours,
        int ects,
        int credits,
        int studentCount,
        CourseType courseType,
        Semester semester,
        UUID academicPeriodId,
        String academicPeriodDisplayName,
        int grade,
        boolean active
) {
}
