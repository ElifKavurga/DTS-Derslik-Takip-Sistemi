package com.dts.dersliktakip.dto;

import com.dts.dersliktakip.entity.SpaceObjectStatus;
import com.dts.dersliktakip.entity.SpaceObjectType;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SpaceObjectRequest {

    @NotNull(message = "Nesne ID zorunludur.")
    private UUID id;

    private UUID classroomId;

    @NotNull(message = "Nesne türü zorunludur.")
    private SpaceObjectType type;

    private SpaceObjectStatus status;
    private String label;
    private String code;
    private Integer capacity;

    @NotNull
    private Double positionX;

    @NotNull
    private Double positionY;

    private Double width;
    private Double height;
    private Double rotation;
    private Integer slotRow;
    private Integer slotColumn;
    private String metadataJson;
}
