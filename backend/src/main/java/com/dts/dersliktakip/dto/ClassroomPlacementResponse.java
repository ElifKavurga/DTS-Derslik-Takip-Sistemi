package com.dts.dersliktakip.dto;

import com.dts.dersliktakip.entity.ClassroomType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClassroomPlacementResponse {
    private UUID id;
    private String name;
    private String code;
    private Integer capacity;
    private ClassroomType type;
}
