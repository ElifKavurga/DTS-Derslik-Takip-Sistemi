package com.dts.dersliktakip.controller;

import com.dts.dersliktakip.dto.CreateExtraLessonRequest;
import com.dts.dersliktakip.dto.CreateScheduleCancellationRequest;
import com.dts.dersliktakip.dto.CreateScheduleMakeupRequest;
import com.dts.dersliktakip.dto.ScheduleExceptionResponse;
import com.dts.dersliktakip.security.UserPrincipal;
import com.dts.dersliktakip.service.ScheduleExceptionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/academician/schedule-exceptions")
@RequiredArgsConstructor
public class ScheduleExceptionController {

    private final ScheduleExceptionService scheduleExceptionService;

    @GetMapping
    @PreAuthorize("hasAnyRole('DEPARTMENT_ADMIN', 'ACADEMICIAN')")
    public ResponseEntity<List<ScheduleExceptionResponse>> getMyExceptions(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) LocalDate weekStart,
            @RequestParam(required = false) LocalDate weekEnd
    ) {
        return ResponseEntity.ok(scheduleExceptionService.getMyExceptions(principal.getUser(), weekStart, weekEnd));
    }

    @PostMapping("/cancel")
    @PreAuthorize("hasRole('ACADEMICIAN')")
    public ResponseEntity<ScheduleExceptionResponse> cancelLesson(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateScheduleCancellationRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(scheduleExceptionService.cancelLesson(request, principal.getUser()));
    }

    @PostMapping("/makeup")
    @PreAuthorize("hasRole('ACADEMICIAN')")
    public ResponseEntity<ScheduleExceptionResponse> createMakeup(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateScheduleMakeupRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(scheduleExceptionService.createMakeup(request, principal.getUser()));
    }

    @PostMapping("/extra")
    @PreAuthorize("hasRole('ACADEMICIAN')")
    public ResponseEntity<ScheduleExceptionResponse> createExtraLesson(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateExtraLessonRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(scheduleExceptionService.createExtraLesson(request, principal.getUser()));
    }
}
