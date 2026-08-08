package com.dts.dersliktakip.controller;

import com.dts.dersliktakip.dto.CreateFacultyRequest;
import com.dts.dersliktakip.dto.FacultyDetailResponse;
import com.dts.dersliktakip.dto.FacultyListResponse;
import com.dts.dersliktakip.dto.FacultyResponse;
import com.dts.dersliktakip.dto.UpdateFacultyRequest;
import com.dts.dersliktakip.security.UserPrincipal;
import com.dts.dersliktakip.service.FacultyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/faculties")
@RequiredArgsConstructor
public class FacultyController {

    private final FacultyService facultyService;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'DEPARTMENT_ADMIN')")
    public ResponseEntity<FacultyListResponse> getAllFaculties(@AuthenticationPrincipal UserPrincipal principal) {
        List<FacultyResponse> faculties = facultyService.getVisibleFaculties(principal.getUser());
        return ResponseEntity.ok(new FacultyListResponse(faculties));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<FacultyDetailResponse> getFacultyById(@PathVariable UUID id) {
        return ResponseEntity.ok(facultyService.getFacultyDetailById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<FacultyResponse> createFaculty(@Valid @RequestBody CreateFacultyRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(facultyService.createFaculty(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<FacultyResponse> updateFaculty(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateFacultyRequest request
    ) {
        return ResponseEntity.ok(facultyService.updateFaculty(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> deleteFaculty(@PathVariable UUID id) {
        facultyService.deleteFaculty(id);
        return ResponseEntity.noContent().build();
    }
}
