package com.dts.dersliktakip.dto;

import com.dts.dersliktakip.entity.CourseType;
import com.dts.dersliktakip.entity.Semester;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateCourseRequest(
        @NotBlank @Size(max = 20) String code,
        @NotBlank @Size(max = 255) String name,
        @NotNull UUID facultyId,
        @NotNull UUID departmentId,
        @NotNull UUID academicianId,
        @Min(0) int theoreticalHours,
        @Min(0) int practicalHours,
        @Min(1) int ects,
        @Min(0) int credits,
        @NotNull CourseType courseType,
        @NotNull Semester semester,
        @Min(1) @Max(6) int grade,
        boolean active
) {
}
