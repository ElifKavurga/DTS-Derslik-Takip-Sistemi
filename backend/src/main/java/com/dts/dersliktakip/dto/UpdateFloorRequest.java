package com.dts.dersliktakip.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateFloorRequest {

    @NotBlank(message = "Kat adı zorunludur.")
    @Size(max = 100, message = "Kat adı en fazla 100 karakter olabilir.")
    private String name;

    @NotNull(message = "Kat numarası zorunludur.")
    private Integer level;
}
