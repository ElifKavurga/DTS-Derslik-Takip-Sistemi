package com.dts.dersliktakip.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicFloorDetailResponse {
    private UUID id;
    private String name;
    private Integer level;
    private UUID buildingId;
    private String buildingName;
    private UUID facultyId;
    private String facultyName;
    private String backgroundImageBase64;
    private String backgroundImageType;
    private Double backgroundX;
    private Double backgroundY;
    private Double backgroundWidth;
    private Double backgroundHeight;
    private Double backgroundOpacity;
    private List<PublicSpaceObjectResponse> objects;
}
