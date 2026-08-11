package com.dts.dersliktakip.dto;

import java.util.List;
import java.util.UUID;

public record ScheduleTimeConfigurationResponse(
        UUID departmentId,
        String departmentName,
        String startTime,
        String endTime,
        int lessonDurationMinutes,
        int breakDurationMinutes,
        boolean lunchBreakEnabled,
        String lunchBreakStart,
        String lunchBreakEnd,
        List<ScheduleTimeSlotResponse> slots,
        int affectedScheduleCount
) {
}
