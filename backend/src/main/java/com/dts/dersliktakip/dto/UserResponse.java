package com.dts.dersliktakip.dto;

import com.dts.dersliktakip.entity.Role;

import java.util.UUID;

public record UserResponse(
        UUID id,
        String firstName,
        String lastName,
        String fullName,
        String email,
        Role role
) {
}
