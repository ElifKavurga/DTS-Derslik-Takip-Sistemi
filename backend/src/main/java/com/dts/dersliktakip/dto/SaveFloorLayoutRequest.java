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
public class SaveFloorLayoutRequest {
    private String backgroundImageBase64;
    private String backgroundImageType;
    private Double backgroundX;
    private Double backgroundY;
    private Double backgroundWidth;
    private Double backgroundHeight;
    private Double backgroundOpacity;
    private Boolean backgroundLocked;
    private Double viewportX;
    private Double viewportY;
    private Double viewportZoom;

    @Valid
    private List<SpaceObjectRequest> objects;
}
