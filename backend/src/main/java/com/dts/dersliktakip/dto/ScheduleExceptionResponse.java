package com.dts.dersliktakip.dto;

import com.dts.dersliktakip.entity.ScheduleExceptionType;

import java.time.LocalDate;
import java.util.UUID;

public record ScheduleExceptionResponse(
        UUID id,
        ScheduleExceptionType type,
        UUID originalScheduleId,
        UUID courseId,
        String courseCode,
        String courseName,
        UUID academicianId,
        String academicianName,
        LocalDate originalDate,
        LocalDate targetDate,
        String dayOfWeek,
        String timeSlot,
        int slotCount,
        UUID classroomId,
        String classroomCode,
        String classroomName
) {
}
