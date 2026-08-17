package com.dts.dersliktakip.dto;

import java.util.UUID;

public record PublicClassroomDailyScheduleItemResponse(
        UUID id,
        String sourceType,
        String exceptionType,
        UUID courseId,
        String courseCode,
        String courseName,
        UUID academicianId,
        String academicianName,
        String timeSlot,
        String startTime,
        String endTime
) {
}
