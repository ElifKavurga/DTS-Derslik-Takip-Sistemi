package com.dts.dersliktakip.dto;

import com.dts.dersliktakip.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.Set;
import java.util.UUID;

public record UpdateUserRequest(
        @NotBlank String firstName,
        @NotBlank String lastName,
        @Email @NotBlank String email,
        @NotEmpty Set<Role> roles,
        String phone,
        boolean active,
        String title,
        UUID facultyId,
        UUID departmentId,
        String faculty,
        String department,
        String office
) {
}
