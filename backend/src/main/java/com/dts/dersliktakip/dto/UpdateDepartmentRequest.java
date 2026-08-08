package com.dts.dersliktakip.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record UpdateDepartmentRequest(
        @NotBlank(message = "Bölüm adı zorunludur.")
        @Size(max = 255, message = "Bölüm adı en fazla 255 karakter olabilir.")
        String name,

        @NotBlank(message = "Bölüm kodu zorunludur.")
        @Size(max = 50, message = "Bölüm kodu en fazla 50 karakter olabilir.")
        String code,

        @NotNull(message = "Fakülte seçimi zorunludur.")
        UUID facultyId
) {
}
