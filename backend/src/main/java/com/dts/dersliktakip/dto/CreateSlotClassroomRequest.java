package com.dts.dersliktakip.dto;

import jakarta.validation.constraints.Min;
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
public class CreateSlotClassroomRequest {

    @NotBlank(message = "Sınıf kodu zorunludur.")
    @Size(max = 100, message = "Sınıf kodu en fazla 100 karakter olabilir.")
    private String code;

    @NotBlank(message = "Sınıf adı zorunludur.")
    @Size(max = 255, message = "Sınıf adı en fazla 255 karakter olabilir.")
    private String name;

    @NotNull(message = "Kapasite zorunludur.")
    @Min(value = 1, message = "Kapasite 1 veya daha büyük olmalıdır.")
    private Integer capacity;

    @Size(max = 500, message = "Donanım bilgisi en fazla 500 karakter olabilir.")
    private String equipment;
}
