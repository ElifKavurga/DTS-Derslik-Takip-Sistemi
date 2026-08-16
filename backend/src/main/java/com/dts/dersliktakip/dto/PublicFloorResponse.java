package com.dts.dersliktakip.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicFloorResponse {
    private UUID id;
    private String name;
    private Integer level;
    private UUID buildingId;
}
