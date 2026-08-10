package com.dts.dersliktakip.controller;

import com.dts.dersliktakip.dto.FloorDetailResponse;
import com.dts.dersliktakip.dto.FloorListResponse;
import com.dts.dersliktakip.dto.FloorResponse;
import com.dts.dersliktakip.dto.ClassroomPlacementResponse;
import com.dts.dersliktakip.dto.CreateSlotClassroomRequest;
import com.dts.dersliktakip.dto.CreateFloorRequest;
import com.dts.dersliktakip.dto.UpdateFloorRequest;
import com.dts.dersliktakip.dto.SaveFloorLayoutRequest;
import com.dts.dersliktakip.dto.SaveSlotLayoutRequest;
import com.dts.dersliktakip.dto.SlotLayoutResponse;
import com.dts.dersliktakip.service.FloorLayoutService;
import com.dts.dersliktakip.service.FloorService;
import com.dts.dersliktakip.service.SlotLayoutService;
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
    private final FloorLayoutService floorLayoutService;
    private final SlotLayoutService slotLayoutService;

    @GetMapping("/floors/{floorId}")
    public ResponseEntity<FloorDetailResponse> getFloorDetail(@PathVariable UUID floorId) {
        return ResponseEntity.ok(floorLayoutService.getFloorDetail(floorId));
    }

    @GetMapping("/floors/{floorId}/classrooms")
    public ResponseEntity<List<ClassroomPlacementResponse>> getClassroomsForPlacement(@PathVariable UUID floorId) {
        return ResponseEntity.ok(floorLayoutService.getClassroomsForPlacement(floorId));
    }

    @PostMapping("/floors/{floorId}/layout")
    public ResponseEntity<FloorDetailResponse> saveLayout(
            @PathVariable UUID floorId,
            @Valid @RequestBody SaveFloorLayoutRequest request
    ) {
        return ResponseEntity.ok(floorLayoutService.saveLayout(floorId, request));
    }

    @GetMapping("/floors/{floorId}/slot-layout")
    public ResponseEntity<SlotLayoutResponse> getSlotLayout(@PathVariable UUID floorId) {
        return ResponseEntity.ok(slotLayoutService.getSlotLayout(floorId));
    }

    @PostMapping("/floors/{floorId}/slot-layout")
    public ResponseEntity<SlotLayoutResponse> saveSlotLayout(
            @PathVariable UUID floorId,
            @Valid @RequestBody SaveSlotLayoutRequest request
    ) {
        return ResponseEntity.ok(slotLayoutService.saveSlotLayout(floorId, request));
    }

    @PostMapping("/floors/{floorId}/slot-layout/classrooms")
    public ResponseEntity<SlotLayoutResponse> createSlotClassroom(
            @PathVariable UUID floorId,
            @Valid @RequestBody CreateSlotClassroomRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(slotLayoutService.createClassroomAndPlace(floorId, request));
    }

    @PostMapping("/floors/{floorId}/slot-layout/teaching-spaces")
    public ResponseEntity<SlotLayoutResponse> createSlotTeachingSpace(
            @PathVariable UUID floorId,
            @Valid @RequestBody CreateSlotClassroomRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(slotLayoutService.createClassroomAndPlace(floorId, request));
    }

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
