package com.dts.dersliktakip.dto;

import com.dts.dersliktakip.entity.Semester;

import java.util.List;
import java.util.UUID;

public record ScheduleCompletionResponse(
        UUID departmentId,
        String departmentName,
        Semester semester,
        int totalCourses,
        int completedCourses,
        int incompleteCourses,
        int notScheduledCourses,
        int overScheduledCourses,
        int requiredHours,
        int scheduledHours,
        int missingHours,
        int excessHours,
        int capacityWarningCount,
        int completionPercentage,
        List<CourseScheduleStatusItemResponse> courses
) {
}
