package com.dts.dersliktakip.dto;

import java.util.UUID;

public record ScheduleSlotSummary(
        UUID scheduleId,
        String dayOfWeek,
        String timeSlot,
        UUID classroomId,
        String classroomCode,
        String classroomName
) {
}
