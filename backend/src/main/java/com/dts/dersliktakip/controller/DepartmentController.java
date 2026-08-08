package com.dts.dersliktakip.controller;

import com.dts.dersliktakip.dto.DepartmentResponse;
import com.dts.dersliktakip.entity.Department;
import com.dts.dersliktakip.mapper.DepartmentMapper;
import com.dts.dersliktakip.repository.DepartmentRepository;
import com.dts.dersliktakip.security.UserPrincipal;
import com.dts.dersliktakip.service.AccessScopeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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
    private final AccessScopeService accessScopeService;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'DEPARTMENT_ADMIN')")
    public ResponseEntity<List<DepartmentResponse>> getAllDepartments(@AuthenticationPrincipal UserPrincipal principal) {
        List<Department> departments = accessScopeService.isSuperAdmin(principal.getUser())
                ? departmentRepository.findAll()
                : List.of(accessScopeService.requireDepartmentScope(principal.getUser()));

        List<DepartmentResponse> responses = departments.stream()
                .map(departmentMapper::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/by-faculty/{facultyId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'DEPARTMENT_ADMIN')")
    public ResponseEntity<List<DepartmentResponse>> getDepartmentsByFaculty(
            @PathVariable UUID facultyId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        List<Department> departments;
        if (accessScopeService.isSuperAdmin(principal.getUser())) {
            departments = departmentRepository.findByFacultyId(facultyId);
        } else {
            accessScopeService.assertFacultyAccess(principal.getUser(), facultyId);
            departments = List.of(accessScopeService.requireDepartmentScope(principal.getUser()));
        }

        List<DepartmentResponse> responses = departments.stream()
                .map(departmentMapper::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }
}
