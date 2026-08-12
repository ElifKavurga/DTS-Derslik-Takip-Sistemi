package com.dts.dersliktakip.service;

import com.dts.dersliktakip.dto.DashboardCardStats;
import com.dts.dersliktakip.dto.DashboardStatsResponse;
import com.dts.dersliktakip.dto.DepartmentAdminDashboardResponse;
import com.dts.dersliktakip.dto.RecentBuildingResponse;
import com.dts.dersliktakip.dto.RecentFacultyResponse;
import com.dts.dersliktakip.dto.RecentUserResponse;
import com.dts.dersliktakip.entity.Department;
import com.dts.dersliktakip.entity.Role;
import com.dts.dersliktakip.entity.User;
import com.dts.dersliktakip.repository.AcademicianRepository;
import com.dts.dersliktakip.repository.BuildingRepository;
import com.dts.dersliktakip.repository.ClassroomRepository;
import com.dts.dersliktakip.repository.CourseRepository;
import com.dts.dersliktakip.repository.DepartmentRepository;
import com.dts.dersliktakip.repository.FacultyRepository;
import com.dts.dersliktakip.repository.FloorRepository;
import com.dts.dersliktakip.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final FacultyRepository facultyRepository;
    private final BuildingRepository buildingRepository;
    private final FloorRepository floorRepository;
    private final DepartmentRepository departmentRepository;
    private final ClassroomRepository classroomRepository;
    private final UserRepository userRepository;
    private final AcademicianRepository academicianRepository;
    private final CourseRepository courseRepository;
    private final AccessScopeService accessScopeService;
    private final WeeklyScheduleService weeklyScheduleService;

    @Transactional(readOnly = true)
    public DashboardStatsResponse getDashboardStats() {
        DashboardCardStats cardStats = DashboardCardStats.builder()
                .totalFaculties(facultyRepository.count())
                .totalBuildings(buildingRepository.count())
                .totalFloors(floorRepository.count())
                .totalDepartments(departmentRepository.count())
                .totalClassrooms(classroomRepository.count())
                .totalAcademicians(userRepository.countByRole(Role.ACADEMICIAN))
                .totalDepartmentAdmins(userRepository.countByRole(Role.DEPARTMENT_ADMIN))
                .totalUsers(userRepository.count())
                .build();

        List<RecentFacultyResponse> recentFaculties = facultyRepository.findTop5ByOrderByCreatedAtDesc()
                .stream()
                .map(faculty -> RecentFacultyResponse.builder()
                        .id(faculty.getId())
                        .name(faculty.getName())
                        .code(faculty.getCode())
                        .createdAt(faculty.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        List<RecentBuildingResponse> recentBuildings = buildingRepository.findTop5ByOrderByCreatedAtDesc()
                .stream()
                .map(building -> RecentBuildingResponse.builder()
                        .id(building.getId())
                        .name(building.getName())
                        .code(building.getCode())
                        .facultyName(building.getFaculty().getName())
                        .createdAt(building.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        List<RecentUserResponse> recentUsers = userRepository.findTop5ByOrderByCreatedAtDesc()
                .stream()
                .map(user -> RecentUserResponse.builder()
                        .id(user.getId())
                        .firstName(user.getFirstName())
                        .lastName(user.getLastName())
                        .email(user.getEmail())
                        .role(user.getRoles() != null && !user.getRoles().isEmpty() ? user.getRoles().iterator().next() : null)
                        .createdAt(user.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        return DashboardStatsResponse.builder()
                .stats(cardStats)
                .recentFaculties(recentFaculties)
                .recentBuildings(recentBuildings)
                .recentUsers(recentUsers)
                .build();
    }

    @Transactional(readOnly = true)
    public DepartmentAdminDashboardResponse getDepartmentAdminDashboard(User currentUser, com.dts.dersliktakip.entity.Semester semester) {
        Department department = accessScopeService.requireDepartmentScope(currentUser);

        long classroomCount = classroomRepository.findAllByFloorBuildingFacultyIdOrderByCodeAsc(department.getFaculty().getId()).size();
        
        com.dts.dersliktakip.dto.ScheduleCompletionResponse scheduleSummary = weeklyScheduleService.getScheduleCompletion(currentUser, semester);
        
        java.util.List<String> warnings = new java.util.ArrayList<>();
        if (scheduleSummary.incompleteCourses() > 0) {
            warnings.add(scheduleSummary.incompleteCourses() + " dersin programı eksik.");
        }
        if (scheduleSummary.notScheduledCourses() > 0) {
            warnings.add(scheduleSummary.notScheduledCourses() + " ders henüz programlanmamış.");
        }
        if (scheduleSummary.overScheduledCourses() > 0) {
            warnings.add(scheduleSummary.overScheduledCourses() + " dersin haftalık saat ihtiyacı aşılmış.");
        }

        return DepartmentAdminDashboardResponse.builder()
                .departmentId(department.getId())
                .departmentName(department.getName())
                .departmentCode(department.getCode())
                .facultyId(department.getFaculty().getId())
                .facultyName(department.getFaculty().getName())
                .academicianCount(academicianRepository.countByDepartment_Id(department.getId()))
                .courseCount(courseRepository.countByDepartment_Id(department.getId()))
                .semester(semester)
                .classroomCount(classroomCount)
                .scheduleSummary(scheduleSummary)
                .warnings(warnings)
                .build();
    }
}
