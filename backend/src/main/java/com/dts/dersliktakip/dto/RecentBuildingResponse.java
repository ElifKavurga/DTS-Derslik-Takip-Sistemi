package com.dts.dersliktakip.dto;

import lombok.Builder;
import lombok.Data;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class RecentBuildingResponse {
    private UUID id;
    private String name;
    private String code;
    private String facultyName;
    private Instant createdAt;
}
