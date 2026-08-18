package com.dts.dersliktakip.controller;

import com.dts.dersliktakip.dto.AcademicPeriodResponse;
import com.dts.dersliktakip.dto.CreateAcademicPeriodRequest;
import com.dts.dersliktakip.dto.UpdateAcademicPeriodRequest;
import com.dts.dersliktakip.service.AcademicPeriodService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/academic-periods")
@RequiredArgsConstructor
public class AcademicPeriodController {

    private final AcademicPeriodService academicPeriodService;

    @GetMapping
    public ResponseEntity<List<AcademicPeriodResponse>> getAllPeriods(
            @RequestParam(required = false) Integer limit
    ) {
        return ResponseEntity.ok(academicPeriodService.getAllPeriods(limit));
    }

    @GetMapping("/active")
    public ResponseEntity<AcademicPeriodResponse> getActivePeriod() {
        return ResponseEntity.ok(academicPeriodService.getActivePeriod());
    }

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<AcademicPeriodResponse> createPeriod(
            @Valid @RequestBody CreateAcademicPeriodRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(academicPeriodService.createPeriod(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<AcademicPeriodResponse> updatePeriod(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateAcademicPeriodRequest request
    ) {
        return ResponseEntity.ok(academicPeriodService.updatePeriod(id, request));
    }

    @PutMapping("/{id}/activate")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> activatePeriod(
            @PathVariable UUID id
    ) {
        academicPeriodService.activatePeriod(id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> deletePeriod(
            @PathVariable UUID id
    ) {
        academicPeriodService.deletePeriod(id);
        return ResponseEntity.noContent().build();
    }
}
