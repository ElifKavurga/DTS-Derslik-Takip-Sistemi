package com.dts.dersliktakip.dto;

import com.dts.dersliktakip.entity.SpaceObjectStatus;
import com.dts.dersliktakip.entity.SpaceObjectType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SpaceObjectResponse {
    private UUID id;
    private UUID classroomId;
    private SpaceObjectType type;
    private SpaceObjectStatus status;
    private String label;
    private String code;
    private Integer capacity;
    private Double positionX;
    private Double positionY;
    private Double width;
    private Double height;
    private Double rotation;
    private Integer slotRow;
    private Integer slotColumn;
    private String metadataJson;
}
