package com.dts.dersliktakip.controller;

import com.dts.dersliktakip.dto.DepartmentResponse;
import com.dts.dersliktakip.mapper.DepartmentMapper;
import com.dts.dersliktakip.repository.DepartmentRepository;
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
@RequestMapping("/api/departments")
@RequiredArgsConstructor
public class DepartmentController {

    private final DepartmentRepository departmentRepository;
    private final DepartmentMapper departmentMapper;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'DEPARTMENT_ADMIN')")
    public ResponseEntity<List<DepartmentResponse>> getAllDepartments() {
        List<DepartmentResponse> responses = departmentRepository.findAll().stream()
                .map(departmentMapper::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/by-faculty/{facultyId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'DEPARTMENT_ADMIN')")
    public ResponseEntity<List<DepartmentResponse>> getDepartmentsByFaculty(@PathVariable UUID facultyId) {
        List<DepartmentResponse> responses = departmentRepository.findByFacultyId(facultyId).stream()
                .map(departmentMapper::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }
}
