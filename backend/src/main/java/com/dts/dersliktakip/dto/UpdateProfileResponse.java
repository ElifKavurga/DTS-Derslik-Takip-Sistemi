package com.dts.dersliktakip.dto;

import com.dts.dersliktakip.entity.Role;
import java.util.UUID;

public record UpdateProfileResponse(
        UUID id,
        String firstName,
        String lastName,
        String fullName,
        String email,
        Role role,
        String phone,
        String title,
        String department,
        String faculty,
        String avatarUrl
) {
}
