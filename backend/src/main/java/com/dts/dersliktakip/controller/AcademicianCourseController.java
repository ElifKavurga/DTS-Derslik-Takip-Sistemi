package com.dts.dersliktakip.controller;

import com.dts.dersliktakip.dto.AcademicianCourseDetailResponse;
import com.dts.dersliktakip.entity.Semester;
import com.dts.dersliktakip.security.UserPrincipal;
import com.dts.dersliktakip.service.CourseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/academician/courses")
@RequiredArgsConstructor
public class AcademicianCourseController {

    private final CourseService courseService;

    @GetMapping
    @PreAuthorize("hasRole('ACADEMICIAN')")
    public ResponseEntity<List<AcademicianCourseDetailResponse>> getMyCourses(
            @RequestParam(required = false) UUID periodId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(courseService.getAcademicianCourses(principal.getUser(), periodId));
    }

    @GetMapping("/{courseId}")
    @PreAuthorize("hasRole('ACADEMICIAN')")
    public ResponseEntity<AcademicianCourseDetailResponse> getCourseDetail(
            @PathVariable UUID courseId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(courseService.getAcademicianCourseDetail(courseId, principal.getUser()));
    }
}
