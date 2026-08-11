package com.dts.dersliktakip.dto;

import java.util.UUID;

public record CourseScheduleStatusItemResponse(
        UUID courseId,
        String courseCode,
        String courseName,
        String academicianName,
        int grade,
        int requiredHours,
        int scheduledHours,
        int remainingHours,
        String status
) {
}
