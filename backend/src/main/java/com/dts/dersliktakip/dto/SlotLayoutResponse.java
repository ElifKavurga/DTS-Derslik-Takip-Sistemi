package com.dts.dersliktakip.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SlotLayoutResponse {
    private UUID id;
    private UUID floorId;
    private Integer rows;
    private Integer columns;
    private Instant createdAt;
    private Instant updatedAt;
    private List<SpaceObjectResponse> objects;
}
