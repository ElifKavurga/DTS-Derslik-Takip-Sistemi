package com.dts.dersliktakip.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record ScheduleTimeConfigurationRequest(
        @NotBlank @Pattern(regexp = "^\\d{2}:\\d{2}$") String startTime,
        @NotBlank @Pattern(regexp = "^\\d{2}:\\d{2}$") String endTime,
        @Min(15) @Max(240) int lessonDurationMinutes,
        @Min(0) @Max(120) int breakDurationMinutes,
        boolean lunchBreakEnabled,
        @NotBlank @Pattern(regexp = "^\\d{2}:\\d{2}$") String lunchBreakStart,
        @NotBlank @Pattern(regexp = "^\\d{2}:\\d{2}$") String lunchBreakEnd
) {
}
