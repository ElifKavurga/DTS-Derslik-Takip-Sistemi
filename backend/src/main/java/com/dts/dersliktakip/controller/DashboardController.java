package com.dts.dersliktakip.controller;

import com.dts.dersliktakip.dto.DashboardStatsResponse;
import com.dts.dersliktakip.dto.DepartmentAdminDashboardResponse;
import com.dts.dersliktakip.security.UserPrincipal;
import com.dts.dersliktakip.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/stats")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<DashboardStatsResponse> getDashboardStats() {
        return ResponseEntity.ok(dashboardService.getDashboardStats());
    }

    @GetMapping("/department-admin")
    @PreAuthorize("hasRole('DEPARTMENT_ADMIN')")
    public ResponseEntity<DepartmentAdminDashboardResponse> getDepartmentAdminDashboard(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(dashboardService.getDepartmentAdminDashboard(principal.getUser()));
    }
}
