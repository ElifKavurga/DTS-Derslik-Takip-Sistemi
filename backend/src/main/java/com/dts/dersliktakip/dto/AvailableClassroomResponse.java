package com.dts.dersliktakip.dto;

import com.dts.dersliktakip.entity.ClassroomType;

import java.util.UUID;

public record AvailableClassroomResponse(
        UUID id,
        String code,
        String name,
        Integer capacity,
        ClassroomType type,
        boolean available,
        String conflictMessage,
        Boolean timeSlotAvailable,
        Boolean capacitySufficient,
        Integer studentCount,
        boolean selectable
) {
}
