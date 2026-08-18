package com.dts.dersliktakip.service;

import com.dts.dersliktakip.dto.AcademicianDashboardResponse;
import com.dts.dersliktakip.dto.AcademicianResponse;
import com.dts.dersliktakip.dto.CourseResponse;
import com.dts.dersliktakip.dto.DashboardCardStats;
import com.dts.dersliktakip.dto.DashboardStatsResponse;
import com.dts.dersliktakip.dto.DepartmentAdminDashboardResponse;
import com.dts.dersliktakip.dto.RecentBuildingResponse;
import com.dts.dersliktakip.dto.RecentFacultyResponse;
import com.dts.dersliktakip.dto.RecentUserResponse;
import com.dts.dersliktakip.dto.WeeklyScheduleResponse;
import com.dts.dersliktakip.entity.Academician;
import com.dts.dersliktakip.entity.Course;
import com.dts.dersliktakip.entity.Department;
import com.dts.dersliktakip.entity.Role;
import com.dts.dersliktakip.entity.User;
import com.dts.dersliktakip.entity.WeeklySchedule;
import com.dts.dersliktakip.mapper.AcademicianMapper;
import com.dts.dersliktakip.mapper.CourseMapper;
import com.dts.dersliktakip.repository.AcademicianRepository;
import com.dts.dersliktakip.repository.BuildingRepository;
import com.dts.dersliktakip.repository.ClassroomRepository;
import com.dts.dersliktakip.repository.CourseRepository;
import com.dts.dersliktakip.repository.DepartmentRepository;
import com.dts.dersliktakip.repository.FacultyRepository;
import com.dts.dersliktakip.repository.FloorRepository;
import com.dts.dersliktakip.repository.UserRepository;
import com.dts.dersliktakip.repository.WeeklyScheduleRepository;
import com.dts.dersliktakip.repository.AcademicPeriodRepository;
import com.dts.dersliktakip.entity.AcademicPeriod;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
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
    private final WeeklyScheduleRepository weeklyScheduleRepository;
    private final AcademicianMapper academicianMapper;
    private final CourseMapper courseMapper;
    private final AcademicPeriodRepository academicPeriodRepository;

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

    private AcademicPeriod getActualPeriod(UUID periodId) {
        if (periodId != null) {
            return academicPeriodRepository.findById(periodId)
                    .orElseThrow(() -> new IllegalArgumentException("Dönem bulunamadı."));
        }
        return academicPeriodRepository.findByIsActiveTrue()
                .orElseThrow(() -> new IllegalArgumentException("Aktif bir akademik dönem bulunamadı."));
    }

    @Transactional(readOnly = true)
    public DepartmentAdminDashboardResponse getDepartmentAdminDashboard(User currentUser, UUID periodId) {
        Department department = accessScopeService.requireDepartmentScope(currentUser);
        AcademicPeriod period = getActualPeriod(periodId);

        long classroomCount = classroomRepository.findAllByFloorBuildingFacultyIdOrderByCodeAsc(department.getFaculty().getId()).size();
        
        com.dts.dersliktakip.dto.ScheduleCompletionResponse scheduleSummary = weeklyScheduleService.getScheduleCompletion(currentUser, period.getId());
        
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
        if (scheduleSummary.capacityWarningCount() > 0) {
            warnings.add(scheduleSummary.capacityWarningCount() + " program kaydında kapasite uyarısı var.");
        }

        com.dts.dersliktakip.entity.Semester semesterEnum = period.getTermType() == com.dts.dersliktakip.entity.TermType.SPRING ? com.dts.dersliktakip.entity.Semester.BAHAR : com.dts.dersliktakip.entity.Semester.GUZ;

        return DepartmentAdminDashboardResponse.builder()
                .departmentId(department.getId())
                .departmentName(department.getName())
                .departmentCode(department.getCode())
                .facultyId(department.getFaculty().getId())
                .facultyName(department.getFaculty().getName())
                .academicianCount(academicianRepository.countByDepartment_Id(department.getId()))
                .courseCount(courseRepository.countByDepartment_Id(department.getId()))
                .semester(semesterEnum)
                .academicPeriodId(period.getId())
                .academicPeriodDisplayName(period.getDisplayName())
                .classroomCount(classroomCount)
                .scheduleSummary(scheduleSummary)
                .warnings(warnings)
                .build();
    }

    @Transactional(readOnly = true)
    public AcademicianDashboardResponse getAcademicianDashboard(User currentUser, UUID periodId) {
        Academician academician = academicianRepository.findByEmail(currentUser.getEmail())
                .orElseThrow(() -> new AccessDeniedException("Akademisyen kaydı bulunamadı."));
        AcademicPeriod period = getActualPeriod(periodId);

        List<Course> courses = courseRepository.findAllByAcademicianIdAndAcademicPeriodId(academician.getId(), period.getId());
        List<WeeklySchedule> schedules = weeklyScheduleRepository.findAllByCourse_Academician_IdAndCourse_AcademicPeriod_IdOrderByDayOfWeekAscTimeSlotAsc(academician.getId(), period.getId());

        LocalDate today = LocalDate.now(ZoneId.of("Europe/Istanbul"));
        LocalTime nowTime = LocalTime.now(ZoneId.of("Europe/Istanbul"));
        String todayDayOfWeek = today.getDayOfWeek().name();

        List<WeeklyScheduleResponse> todayCourses = schedules.stream()
                .filter(ws -> ws.getDayOfWeek().equalsIgnoreCase(todayDayOfWeek))
                .sorted(Comparator.comparing(ws -> getStartTime(ws.getTimeSlot())))
                .map(weeklyScheduleService::toResponse)
                .toList();

        WeeklyScheduleResponse nextCourse = todayCourses.stream()
                .filter(ws -> !getStartTime(ws.timeSlot()).isBefore(nowTime))
                .findFirst()
                .orElse(null);

        Map<String, Long> weeklySummary = schedules.stream()
                .collect(Collectors.groupingBy(
                        WeeklySchedule::getDayOfWeek,
                        Collectors.mapping(
                                ws -> ws.getScheduleGroupId() != null ? ws.getScheduleGroupId() : ws.getCourse().getId() + "-" + ws.getDayOfWeek() + "-" + ws.getTimeSlot(),
                                Collectors.toSet()
                        )
                ))
                .entrySet().stream()
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        entry -> (long) entry.getValue().size()
                ));

        Map<String, Long> completeSummary = new LinkedHashMap<>();
        for (String day : List.of("MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY")) {
            completeSummary.put(day, weeklySummary.getOrDefault(day, 0L));
        }

        String academicTerm = period.getDisplayName();

        return AcademicianDashboardResponse.builder()
                .academician(academicianMapper.toResponse(academician))
                .academicTerm(academicTerm)
                .todayCourses(todayCourses)
                .nextCourse(nextCourse)
                .courses(courses.stream().map(courseMapper::toResponse).toList())
                .weeklySummary(completeSummary)
                .build();
    }

    private LocalTime getStartTime(String timeSlot) {
        if (timeSlot == null || !timeSlot.contains("-")) {
            return LocalTime.MIN;
        }
        try {
            return LocalTime.parse(timeSlot.split("-")[0].trim(), DateTimeFormatter.ofPattern("HH:mm"));
        } catch (Exception e) {
            return LocalTime.MIN;
        }
    }
}
