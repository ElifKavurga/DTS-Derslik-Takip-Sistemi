package com.dts.dersliktakip.controller;

import com.dts.dersliktakip.dto.AcademicianResponse;
import com.dts.dersliktakip.mapper.AcademicianMapper;
import com.dts.dersliktakip.repository.AcademicianRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/academicians")
@RequiredArgsConstructor
public class AcademicianController {

    private final AcademicianRepository academicianRepository;
    private final AcademicianMapper academicianMapper;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'DEPARTMENT_ADMIN')")
    public ResponseEntity<List<AcademicianResponse>> getAllAcademicians() {
        List<AcademicianResponse> responses = academicianRepository.findAll().stream()
                .map(academicianMapper::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/by-department/{departmentId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'DEPARTMENT_ADMIN')")
    public ResponseEntity<List<AcademicianResponse>> getAcademiciansByDepartment(@PathVariable UUID departmentId) {
        List<AcademicianResponse> responses = academicianRepository.findByDepartmentId(departmentId).stream()
                .map(academicianMapper::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }
}
