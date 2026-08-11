package com.dts.dersliktakip.dto;

public record ScheduleTimeSlotResponse(
        String value,
        String startTime,
        String endTime,
        int index
) {
}
