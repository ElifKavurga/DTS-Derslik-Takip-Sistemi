package com.dts.dersliktakip.service;

import com.dts.dersliktakip.dto.DashboardCardStats;
import com.dts.dersliktakip.dto.DashboardStatsResponse;
import com.dts.dersliktakip.dto.RecentBuildingResponse;
import com.dts.dersliktakip.dto.RecentFacultyResponse;
import com.dts.dersliktakip.dto.RecentUserResponse;
import com.dts.dersliktakip.entity.Role;
import com.dts.dersliktakip.repository.BuildingRepository;
import com.dts.dersliktakip.repository.ClassroomRepository;
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
                        .role(user.getRole())
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
}
