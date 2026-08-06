package com.dts.dersliktakip.controller;

import com.dts.dersliktakip.dto.FloorListResponse;
import com.dts.dersliktakip.dto.FloorResponse;
import com.dts.dersliktakip.dto.CreateFloorRequest;
import com.dts.dersliktakip.dto.UpdateFloorRequest;
import com.dts.dersliktakip.service.FloorService;
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
public class FloorController {

    private final FloorService floorService;

    @GetMapping("/buildings/{buildingId}/floors")
    public ResponseEntity<FloorListResponse> getFloorsByBuildingId(@PathVariable UUID buildingId) {
        List<FloorResponse> floors = floorService.getFloorsByBuildingId(buildingId);
        return ResponseEntity.ok(new FloorListResponse(floors));
    }

    @PostMapping("/buildings/{buildingId}/floors")
    public ResponseEntity<FloorResponse> createFloor(
            @PathVariable UUID buildingId,
            @Valid @RequestBody CreateFloorRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(floorService.createFloor(buildingId, request));
    }

    @PutMapping("/floors/{floorId}")
    public ResponseEntity<FloorResponse> updateFloor(
            @PathVariable UUID floorId,
            @Valid @RequestBody UpdateFloorRequest request
    ) {
        return ResponseEntity.ok(floorService.updateFloor(floorId, request));
    }

    @DeleteMapping("/floors/{floorId}")
    public ResponseEntity<Void> deleteFloor(@PathVariable UUID floorId) {
        floorService.deleteFloor(floorId);
        return ResponseEntity.noContent().build();
    }
}
