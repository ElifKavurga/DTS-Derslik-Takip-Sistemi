package com.dts.dersliktakip.controller;

import com.dts.dersliktakip.dto.BuildingDetailResponse;
import com.dts.dersliktakip.dto.BuildingListResponse;
import com.dts.dersliktakip.dto.BuildingResponse;
import com.dts.dersliktakip.dto.CreateBuildingRequest;
import com.dts.dersliktakip.dto.UpdateBuildingRequest;
import com.dts.dersliktakip.service.BuildingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

import com.dts.dersliktakip.security.UserPrincipal;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class BuildingController {

    private final BuildingService buildingService;

    @GetMapping("/buildings/{buildingId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'DEPARTMENT_ADMIN')")
    public ResponseEntity<BuildingDetailResponse> getBuildingById(
            @PathVariable UUID buildingId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(buildingService.getBuildingDetailById(buildingId, principal.getUser()));
    }

    @GetMapping("/faculties/{facultyId}/buildings")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'DEPARTMENT_ADMIN')")
    public ResponseEntity<BuildingListResponse> getBuildingsByFacultyId(
            @PathVariable UUID facultyId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        List<BuildingResponse> buildings = buildingService.getBuildingsByFacultyId(facultyId, principal.getUser());
        return ResponseEntity.ok(new BuildingListResponse(buildings));
    }

    @PostMapping("/faculties/{facultyId}/buildings")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<BuildingResponse> createBuilding(
            @PathVariable UUID facultyId,
            @Valid @RequestBody CreateBuildingRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(buildingService.createBuilding(facultyId, request));
    }

    @PutMapping("/buildings/{buildingId}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<BuildingResponse> updateBuilding(
            @PathVariable UUID buildingId,
            @Valid @RequestBody UpdateBuildingRequest request
    ) {
        return ResponseEntity.ok(buildingService.updateBuilding(buildingId, request));
    }

    @DeleteMapping("/buildings/{buildingId}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> deleteBuilding(@PathVariable UUID buildingId) {
        buildingService.deleteBuilding(buildingId);
        return ResponseEntity.noContent().build();
    }
}
