package com.dts.dersliktakip.dto;

import com.dts.dersliktakip.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.Set;

public record CreateUserRequest(
        @NotBlank String firstName,
        @NotBlank String lastName,
        @Email @NotBlank String email,
        @NotBlank String password,
        Set<Role> roles,
        String phone,
        boolean active,
        String title,
        String faculty,
        String department,
        String office
) {
}
