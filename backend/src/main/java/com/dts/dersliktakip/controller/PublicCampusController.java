package com.dts.dersliktakip.controller;

import com.dts.dersliktakip.dto.PublicBuildingListResponse;
import com.dts.dersliktakip.dto.PublicBuildingResponse;
import com.dts.dersliktakip.dto.PublicFacultyListResponse;
import com.dts.dersliktakip.dto.PublicFacultyResponse;
import com.dts.dersliktakip.service.PublicCampusService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
public class PublicCampusController {

    private final PublicCampusService publicCampusService;

    @GetMapping("/faculties")
    public ResponseEntity<PublicFacultyListResponse> getFaculties() {
        List<PublicFacultyResponse> faculties = publicCampusService.getFaculties();
        return ResponseEntity.ok(new PublicFacultyListResponse(faculties));
    }

    @GetMapping("/faculties/{facultyId}/buildings")
    public ResponseEntity<PublicBuildingListResponse> getBuildingsByFacultyId(@PathVariable UUID facultyId) {
        List<PublicBuildingResponse> buildings = publicCampusService.getBuildingsByFacultyId(facultyId);
        return ResponseEntity.ok(new PublicBuildingListResponse(buildings));
    }

    @GetMapping("/faculties/{facultyId}/buildings/{buildingId}")
    public ResponseEntity<PublicBuildingResponse> getBuildingByFacultyId(
            @PathVariable UUID facultyId,
            @PathVariable UUID buildingId
    ) {
        return ResponseEntity.ok(publicCampusService.getBuildingByFacultyId(facultyId, buildingId));
    }
}
