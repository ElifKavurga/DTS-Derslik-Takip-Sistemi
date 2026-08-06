package com.dts.dersliktakip.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @NotBlank(message = "Ad bos olamaz")
        @Size(max = 100, message = "Ad en fazla 100 karakter olabilir")
        String firstName,

        @NotBlank(message = "Soyad bos olamaz")
        @Size(max = 100, message = "Soyad en fazla 100 karakter olabilir")
        String lastName,

        @Size(max = 20, message = "Telefon numarasi en fazla 20 karakter olabilir")
        String phone,

        @Size(max = 100, message = "Unvan en fazla 100 karakter olabilir")
        String title,

        @Size(max = 255, message = "Avatar URL en fazla 255 karakter olabilir")
        String avatarUrl
) {
}
