package com.dts.dersliktakip.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record PublicWeeklyScheduleResponse(
        UUID classroomId,
        String classroomCode,
        String classroomName,
        LocalDate startDate,
        LocalDate endDate,
        List<PublicWeeklyScheduleDayResponse> days
) {
}
