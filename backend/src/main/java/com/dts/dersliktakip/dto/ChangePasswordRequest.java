package com.dts.dersliktakip.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChangePasswordRequest(
        @NotBlank(message = "Mevcut şifre boş olamaz")
        String currentPassword,

        @NotBlank(message = "Yeni şifre boş olamaz")
        @Size(min = 8, message = "Yeni şifre en az 8 karakter olmalıdır")
        String newPassword,

        @NotBlank(message = "Yeni şifre tekrarı boş olamaz")
        String confirmPassword
) {
}
