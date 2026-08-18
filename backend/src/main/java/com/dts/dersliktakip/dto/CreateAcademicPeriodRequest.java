package com.dts.dersliktakip.dto;

import com.dts.dersliktakip.entity.TermType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import java.time.LocalDate;

public record CreateAcademicPeriodRequest(
        @NotBlank(message = "Akademik yıl boş olamaz.")
        @Pattern(regexp = "^\\d{4}-\\d{4}$", message = "Akademik yıl YYYY-YYYY formatında olmalıdır (Örn: 2026-2027).")
        String academicYear,

        @NotNull(message = "Dönem tipi seçilmelidir.")
        TermType termType,

        @NotNull(message = "Başlangıç tarihi boş olamaz.")
        LocalDate startDate,

        @NotNull(message = "Bitiş tarihi boş olamaz.")
        LocalDate endDate,

        boolean isActive
) {
}
