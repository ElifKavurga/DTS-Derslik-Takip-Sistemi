package com.dts.dersliktakip.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateWeeklyScheduleRequest(
        @NotNull UUID courseId,
        @NotNull UUID classroomId,
        @NotBlank @Size(max = 20) String dayOfWeek,
        @NotBlank @Size(max = 20) String timeSlot
) {
}
