package com.dts.dersliktakip.dto;

import lombok.Builder;
import java.util.List;
import java.util.Map;

@Builder
public record AcademicianDashboardResponse(
        AcademicianResponse academician,
        String academicTerm,
        List<WeeklyScheduleResponse> todayCourses,
        WeeklyScheduleResponse nextCourse,
        List<CourseResponse> courses,
        Map<String, Long> weeklySummary
) {
}
