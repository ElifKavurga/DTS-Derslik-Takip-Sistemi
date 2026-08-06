package com.dts.dersliktakip.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record ForgotPasswordRequest(
        @NotBlank(message = "E-posta bos olamaz")
        @Email(message = "Gecerli bir e-posta adresi giriniz")
        String email
) {
}
