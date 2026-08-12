package com.dts.dersliktakip.dto;

public record ScheduleSlotSummary(
        String dayOfWeek,
        String timeSlot,
        String classroomCode,
        String classroomName
) {
}
