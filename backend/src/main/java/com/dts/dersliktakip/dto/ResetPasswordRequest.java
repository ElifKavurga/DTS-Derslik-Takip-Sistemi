package com.dts.dersliktakip.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(
        @NotBlank(message = "Token bos olamaz")
        String token,

        @NotBlank(message = "Yeni sifre bos olamaz")
        @Size(min = 8, message = "Sifre en az 8 karakter olmalidir")
        String newPassword
) {
}
