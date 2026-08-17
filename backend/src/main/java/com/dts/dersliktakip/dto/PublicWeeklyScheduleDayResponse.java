package com.dts.dersliktakip.dto;

import java.time.LocalDate;
import java.util.List;

public record PublicWeeklyScheduleDayResponse(
        LocalDate date,
        String dayOfWeek,
        String dayLabel,
        List<PublicClassroomDailyScheduleItemResponse> items
) {
}
