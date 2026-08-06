package com.dts.dersliktakip.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateFacultyRequest {

    @NotBlank(message = "Fakülte adı zorunludur.")
    @Size(max = 255, message = "Fakülte adı en fazla 255 karakter olabilir.")
    private String name;

    @NotBlank(message = "Fakülte kodu zorunludur.")
    @Size(max = 50, message = "Fakülte kodu en fazla 50 karakter olabilir.")
    private String code;
}
