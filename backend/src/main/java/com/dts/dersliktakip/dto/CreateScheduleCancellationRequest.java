package com.dts.dersliktakip.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

public record CreateScheduleCancellationRequest(
        @NotNull UUID scheduleId,
        @NotNull LocalDate date
) {
}
