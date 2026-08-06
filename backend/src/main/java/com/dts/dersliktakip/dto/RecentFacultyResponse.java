package com.dts.dersliktakip.dto;

import lombok.Builder;
import lombok.Data;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class RecentFacultyResponse {
    private UUID id;
    private String name;
    private String code;
    private Instant createdAt;
}
