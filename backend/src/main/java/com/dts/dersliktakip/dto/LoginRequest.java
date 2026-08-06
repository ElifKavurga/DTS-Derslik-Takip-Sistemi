package com.dts.dersliktakip.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank(message = "E-posta bos olamaz")
        @Email(message = "Gecerli bir e-posta adresi giriniz")
        String email,

        @NotBlank(message = "Sifre bos olamaz")
        String password
) {
}
