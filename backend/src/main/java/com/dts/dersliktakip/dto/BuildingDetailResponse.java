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
public class BuildingDetailResponse {
    private UUID id;
    private String name;
    private String code;
    private UUID facultyId;
    private String facultyName;
    private long totalFloors;
    private long totalClassrooms;
}
