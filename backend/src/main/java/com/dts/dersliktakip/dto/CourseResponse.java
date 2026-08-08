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
        CourseType courseType,
        Semester semester,
        int grade,
        boolean active
) {
}
