package com.dts.dersliktakip.controller;

import com.dts.dersliktakip.dto.AcademicianResponse;
import com.dts.dersliktakip.entity.Academician;
import com.dts.dersliktakip.mapper.AcademicianMapper;
import com.dts.dersliktakip.repository.AcademicianRepository;
import com.dts.dersliktakip.security.UserPrincipal;
import com.dts.dersliktakip.service.AccessScopeService;
import com.dts.dersliktakip.service.UserService;
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
@RequestMapping("/api/academicians")
@RequiredArgsConstructor
public class AcademicianController {

    private final AcademicianRepository academicianRepository;
    private final AcademicianMapper academicianMapper;
    private final AccessScopeService accessScopeService;
    private final UserService userService;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'DEPARTMENT_ADMIN')")
    public ResponseEntity<List<AcademicianResponse>> getAllAcademicians(@AuthenticationPrincipal UserPrincipal principal) {
        userService.syncAcademicianRecords();

        List<Academician> academicians = accessScopeService.isSuperAdmin(principal.getUser())
                ? academicianRepository.findAll()
                : academicianRepository.findByDepartmentId(accessScopeService.requireDepartmentScope(principal.getUser()).getId());

        List<AcademicianResponse> responses = academicians.stream()
                .map(academicianMapper::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/by-department/{departmentId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'DEPARTMENT_ADMIN')")
    public ResponseEntity<List<AcademicianResponse>> getAcademiciansByDepartment(
            @PathVariable UUID departmentId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        accessScopeService.assertDepartmentAccess(principal.getUser(), departmentId);
        userService.syncAcademicianRecords();

        List<AcademicianResponse> responses = academicianRepository.findByDepartmentId(departmentId).stream()
                .map(academicianMapper::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }
}
