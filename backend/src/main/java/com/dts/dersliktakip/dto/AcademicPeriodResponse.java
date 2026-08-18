package com.dts.dersliktakip.dto;

import com.dts.dersliktakip.entity.TermType;
import java.time.LocalDate;
import java.util.UUID;

public record AcademicPeriodResponse(
        UUID id,
        String academicYear,
        TermType termType,
        String displayName,
        LocalDate startDate,
        LocalDate endDate,
        boolean isActive
) {
}
