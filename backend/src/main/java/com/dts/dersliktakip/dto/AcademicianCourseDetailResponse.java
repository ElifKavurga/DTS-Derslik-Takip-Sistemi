package com.dts.dersliktakip.dto;

import com.dts.dersliktakip.entity.CourseType;
import com.dts.dersliktakip.entity.Semester;

import java.util.List;
import java.util.UUID;

public record AcademicianCourseDetailResponse(
        UUID id,
        String code,
        String name,
        String departmentName,
        String facultyName,
        int theoreticalHours,
        int practicalHours,
        int ects,
        int credits,
        CourseType courseType,
        Semester semester,
        int grade,
        boolean active,
        int scheduledHours,
        String scheduleStatus,
        List<ScheduleSlotSummary> scheduleSlots
) {
}
