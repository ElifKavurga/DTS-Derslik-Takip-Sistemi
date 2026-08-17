package com.dts.dersliktakip.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record PublicClassroomDailyScheduleResponse(
        UUID classroomId,
        String classroomCode,
        String classroomName,
        LocalDate date,
        String dayOfWeek,
        String dayLabel,
        List<PublicClassroomDailyScheduleItemResponse> items
) {
}
