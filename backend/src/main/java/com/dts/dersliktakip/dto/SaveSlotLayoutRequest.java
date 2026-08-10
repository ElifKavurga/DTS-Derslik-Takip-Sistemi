package com.dts.dersliktakip.dto;

import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SaveSlotLayoutRequest {
    private Integer rows;
    private Integer columns;

    @Valid
    private List<SpaceObjectRequest> objects;
}
