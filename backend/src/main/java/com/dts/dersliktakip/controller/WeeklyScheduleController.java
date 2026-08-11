package com.dts.dersliktakip.controller;

import com.dts.dersliktakip.dto.AvailableClassroomResponse;
import com.dts.dersliktakip.dto.CreateWeeklyScheduleRequest;
import com.dts.dersliktakip.dto.ScheduleCompletionResponse;
import com.dts.dersliktakip.dto.UpdateWeeklyScheduleRequest;
import com.dts.dersliktakip.dto.WeeklyScheduleResponse;
import com.dts.dersliktakip.entity.Semester;
import com.dts.dersliktakip.security.UserPrincipal;
import com.dts.dersliktakip.service.WeeklyScheduleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/schedules")
@RequiredArgsConstructor
public class WeeklyScheduleController {

    private final WeeklyScheduleService weeklyScheduleService;

    @GetMapping
    @PreAuthorize("hasRole('DEPARTMENT_ADMIN')")
    public ResponseEntity<List<WeeklyScheduleResponse>> getSchedules(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) Semester semester
    ) {
        return ResponseEntity.ok(weeklyScheduleService.getSchedules(principal.getUser(), semester));
    }

    @GetMapping("/status")
    @PreAuthorize("hasRole('DEPARTMENT_ADMIN')")
    public ResponseEntity<ScheduleCompletionResponse> getScheduleCompletion(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) Semester semester
    ) {
        return ResponseEntity.ok(weeklyScheduleService.getScheduleCompletion(principal.getUser(), semester));
    }

    @GetMapping("/available-classrooms")
    @PreAuthorize("hasRole('DEPARTMENT_ADMIN')")
    public ResponseEntity<List<AvailableClassroomResponse>> getAvailableClassrooms(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) UUID courseId,
            @RequestParam String dayOfWeek,
            @RequestParam String timeSlot,
            @RequestParam(required = false) UUID excludeScheduleId
    ) {
        return ResponseEntity.ok(weeklyScheduleService.getAvailableClassrooms(principal.getUser(), courseId, dayOfWeek, timeSlot, excludeScheduleId));
    }

    @PostMapping
    @PreAuthorize("hasRole('DEPARTMENT_ADMIN')")
    public ResponseEntity<WeeklyScheduleResponse> createSchedule(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateWeeklyScheduleRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(weeklyScheduleService.createSchedule(request, principal.getUser()));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('DEPARTMENT_ADMIN')")
    public ResponseEntity<WeeklyScheduleResponse> updateSchedule(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateWeeklyScheduleRequest request
    ) {
        return ResponseEntity.ok(weeklyScheduleService.updateSchedule(id, request, principal.getUser()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('DEPARTMENT_ADMIN')")
    public ResponseEntity<Void> deleteSchedule(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        weeklyScheduleService.deleteSchedule(id, principal.getUser());
        return ResponseEntity.noContent().build();
    }
}
