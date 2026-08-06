package com.dts.dersliktakip.dto;

import com.dts.dersliktakip.entity.Role;
import lombok.Builder;
import lombok.Data;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class RecentUserResponse {
    private UUID id;
    private String firstName;
    private String lastName;
    private String email;
    private Role role;
    private Instant createdAt;
}
