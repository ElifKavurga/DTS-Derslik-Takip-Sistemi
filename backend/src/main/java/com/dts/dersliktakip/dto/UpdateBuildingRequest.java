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
public class UpdateBuildingRequest {

    @NotBlank(message = "Bina adı zorunludur.")
    @Size(max = 255, message = "Bina adı en fazla 255 karakter olabilir.")
    private String name;

    @NotBlank(message = "Bina kodu zorunludur.")
    @Size(max = 50, message = "Bina kodu en fazla 50 karakter olabilir.")
    private String code;
}
