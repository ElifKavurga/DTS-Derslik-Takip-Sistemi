package com.dts.dersliktakip.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BuildingResponse {
    private UUID id;
    private String name;
    private String code;
    private UUID facultyId;
    private Instant createdAt;
    private Instant updatedAt;
    private long totalFloors;
    private long totalClassrooms;
}
