package com.dts.dersliktakip.controller;

import com.dts.dersliktakip.dto.PublicBuildingListResponse;
import com.dts.dersliktakip.dto.PublicBuildingResponse;
import com.dts.dersliktakip.dto.PublicClassroomDailyScheduleResponse;
import com.dts.dersliktakip.dto.PublicDepartmentListResponse;
import com.dts.dersliktakip.dto.PublicClassLevelListResponse;
import com.dts.dersliktakip.dto.PublicAcademicianListResponse;
import com.dts.dersliktakip.dto.PublicFacultyListResponse;
import com.dts.dersliktakip.dto.PublicFacultyResponse;
import com.dts.dersliktakip.dto.PublicFloorDetailResponse;
import com.dts.dersliktakip.dto.PublicFloorListResponse;
import com.dts.dersliktakip.dto.PublicFloorResponse;
import com.dts.dersliktakip.service.PublicCampusService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import com.dts.dersliktakip.dto.PublicWeeklyScheduleResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
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

    @GetMapping("/departments")
    public ResponseEntity<PublicDepartmentListResponse> getDepartments() {
        return ResponseEntity.ok(new PublicDepartmentListResponse(publicCampusService.getDepartments()));
    }

    @GetMapping("/departments/{departmentId}/class-levels")
    public ResponseEntity<PublicClassLevelListResponse> getClassLevelsByDepartmentId(@PathVariable UUID departmentId) {
        return ResponseEntity.ok(new PublicClassLevelListResponse(publicCampusService.getClassLevelsByDepartmentId(departmentId)));
    }

    @GetMapping("/departments/{departmentId}/class-levels/{classLevel}/weekly-schedule")
    public ResponseEntity<PublicWeeklyScheduleResponse> getDepartmentWeeklySchedule(
            @PathVariable UUID departmentId,
            @PathVariable int classLevel,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate
    ) {
        PublicWeeklyScheduleResponse response = publicCampusService.getDepartmentWeeklySchedule(departmentId, classLevel, startDate, endDate);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/academicians")
    public ResponseEntity<PublicAcademicianListResponse> getAcademicians() {
        return ResponseEntity.ok(new PublicAcademicianListResponse(publicCampusService.getAcademicians()));
    }

    @GetMapping("/academicians/{academicianId}/weekly-schedule")
    public ResponseEntity<PublicWeeklyScheduleResponse> getAcademicianWeeklySchedule(
            @PathVariable UUID academicianId,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate
    ) {
        PublicWeeklyScheduleResponse response = publicCampusService.getAcademicianWeeklySchedule(academicianId, startDate, endDate);
        return ResponseEntity.ok(response);
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

    @GetMapping("/buildings/{buildingId}/floors")
    public ResponseEntity<PublicFloorListResponse> getFloorsByBuildingId(@PathVariable UUID buildingId) {
        List<PublicFloorResponse> floors = publicCampusService.getFloorsByBuildingId(buildingId);
        return ResponseEntity.ok(new PublicFloorListResponse(floors));
    }

    @GetMapping("/buildings/{buildingId}/floors/{floorId}")
    public ResponseEntity<PublicFloorDetailResponse> getFloorView(
            @PathVariable UUID buildingId,
            @PathVariable UUID floorId
    ) {
        return ResponseEntity.ok(publicCampusService.getFloorView(buildingId, floorId));
    }

    @GetMapping("/classrooms/{classroomId}/schedule")
    public ResponseEntity<PublicClassroomDailyScheduleResponse> getClassroomDailySchedule(
            @PathVariable UUID classroomId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        return ResponseEntity.ok(publicCampusService.getClassroomDailySchedule(classroomId, date));
    }

    @GetMapping("/classrooms/{classroomId}/weekly-schedule")
    public ResponseEntity<PublicWeeklyScheduleResponse> getClassroomWeeklySchedule(
            @PathVariable UUID classroomId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        return ResponseEntity.ok(publicCampusService.getClassroomWeeklySchedule(classroomId, startDate, endDate));
    }
}
