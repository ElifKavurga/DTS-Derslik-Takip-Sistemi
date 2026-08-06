package com.dts.dersliktakip.controller;

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

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class BuildingController {

    private final BuildingService buildingService;

    @GetMapping("/faculties/{facultyId}/buildings")
    public ResponseEntity<BuildingListResponse> getBuildingsByFacultyId(@PathVariable UUID facultyId) {
        List<BuildingResponse> buildings = buildingService.getBuildingsByFacultyId(facultyId);
        return ResponseEntity.ok(new BuildingListResponse(buildings));
    }

    @PostMapping("/faculties/{facultyId}/buildings")
    public ResponseEntity<BuildingResponse> createBuilding(
            @PathVariable UUID facultyId,
            @Valid @RequestBody CreateBuildingRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(buildingService.createBuilding(facultyId, request));
    }

    @PutMapping("/buildings/{buildingId}")
    public ResponseEntity<BuildingResponse> updateBuilding(
            @PathVariable UUID buildingId,
            @Valid @RequestBody UpdateBuildingRequest request
    ) {
        return ResponseEntity.ok(buildingService.updateBuilding(buildingId, request));
    }

    @DeleteMapping("/buildings/{buildingId}")
    public ResponseEntity<Void> deleteBuilding(@PathVariable UUID buildingId) {
        buildingService.deleteBuilding(buildingId);
        return ResponseEntity.noContent().build();
    }
}
