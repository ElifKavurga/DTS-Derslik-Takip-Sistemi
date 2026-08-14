package com.dts.dersliktakip.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

public record CreateScheduleMakeupRequest(
        @NotNull UUID scheduleId,
        @NotNull LocalDate originalDate,
        @NotNull LocalDate makeupDate,
        @NotBlank String timeSlot,
        @Min(1) @Max(12) Integer slotCount,
        @NotNull UUID classroomId
) {
}
