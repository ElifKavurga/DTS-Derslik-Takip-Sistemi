package com.dts.dersliktakip.dto;

import com.dts.dersliktakip.entity.CourseType;
import com.dts.dersliktakip.entity.Semester;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record UpdateCourseRequest(
        @NotBlank @Size(max = 20) String code,
        @NotBlank @Size(max = 255) String name,
        UUID facultyId,
        UUID departmentId,
        @NotNull UUID academicianId,
        @Min(0) int theoreticalHours,
        @Min(0) int practicalHours,
        @Min(1) int ects,
        @Min(0) int credits,
        @Min(value = 0, message = "Ders mevcudu 0'dan küçük olamaz.") int studentCount,
        @NotNull CourseType courseType,
        @NotNull Semester semester,
        UUID academicPeriodId,
        @Min(1) @Max(6) int grade,
        boolean active
) {
}
