package com.dts.dersliktakip.service;

import com.dts.dersliktakip.dto.DepartmentAdminDashboardResponse;
import com.dts.dersliktakip.entity.Department;
import com.dts.dersliktakip.entity.Faculty;
import com.dts.dersliktakip.entity.User;
import com.dts.dersliktakip.repository.AcademicianRepository;
import com.dts.dersliktakip.repository.BuildingRepository;
import com.dts.dersliktakip.repository.ClassroomRepository;
import com.dts.dersliktakip.repository.CourseRepository;
import com.dts.dersliktakip.repository.DepartmentRepository;
import com.dts.dersliktakip.repository.FacultyRepository;
import com.dts.dersliktakip.repository.FloorRepository;
import com.dts.dersliktakip.repository.UserRepository;
import com.dts.dersliktakip.repository.AcademicPeriodRepository;
import com.dts.dersliktakip.entity.AcademicPeriod;
import com.dts.dersliktakip.entity.TermType;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

    @Mock
    private FacultyRepository facultyRepository;

    @Mock
    private BuildingRepository buildingRepository;

    @Mock
    private FloorRepository floorRepository;

    @Mock
    private DepartmentRepository departmentRepository;

    @Mock
    private ClassroomRepository classroomRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AcademicianRepository academicianRepository;

    @Mock
    private CourseRepository courseRepository;

    @Mock
    private AccessScopeService accessScopeService;

    @Mock
    private WeeklyScheduleService weeklyScheduleService;

    @Mock
    private AcademicPeriodRepository academicPeriodRepository;

    @InjectMocks
    private DashboardService dashboardService;

    @Test
    void departmentAdminDashboardUsesAuthenticatedUsersDepartmentScope() {
        UUID facultyId = UUID.randomUUID();
        UUID departmentId = UUID.randomUUID();
        UUID periodId = UUID.randomUUID();
        User currentUser = new User();

        Faculty faculty = new Faculty();
        faculty.setId(facultyId);
        faculty.setName("Muhendislik Fakultesi");

        Department department = new Department();
        department.setId(departmentId);
        department.setName("Bilgisayar Muhendisligi");
        department.setCode("BM");
        department.setFaculty(faculty);

        AcademicPeriod period = new AcademicPeriod();
        period.setId(periodId);
        period.setAcademicYear("2026-2027");
        period.setTermType(TermType.FALL);
        period.setDisplayName("2026-2027 Güz");
        period.setActive(true);

        com.dts.dersliktakip.entity.Semester semester = com.dts.dersliktakip.entity.Semester.GUZ;
        when(accessScopeService.requireDepartmentScope(currentUser)).thenReturn(department);
        when(academicianRepository.countByDepartment_Id(departmentId)).thenReturn(10L);
        when(courseRepository.countByDepartment_Id(departmentId)).thenReturn(20L);
        when(academicPeriodRepository.findById(periodId)).thenReturn(Optional.of(period));
        
        java.util.List<com.dts.dersliktakip.entity.Classroom> mockClassrooms = new java.util.ArrayList<>();
        for (int i = 0; i < 5; i++) {
            mockClassrooms.add(new com.dts.dersliktakip.entity.Classroom());
        }
        when(classroomRepository.findAllByFloorBuildingFacultyIdOrderByCodeAsc(facultyId)).thenReturn(mockClassrooms);
        
        com.dts.dersliktakip.dto.ScheduleCompletionResponse mockScheduleResponse = new com.dts.dersliktakip.dto.ScheduleCompletionResponse(
                departmentId, "Bilgisayar Muhendisligi", semester, periodId, "2026-2027 Güz", 20, 15, 3, 2, 0, 60, 45, 9, 0, 0, 75, java.util.Collections.emptyList()
        );
        when(weeklyScheduleService.getScheduleCompletion(currentUser, periodId)).thenReturn(mockScheduleResponse);

        DepartmentAdminDashboardResponse response = dashboardService.getDepartmentAdminDashboard(currentUser, periodId);

        assertThat(response.departmentId()).isEqualTo(departmentId);
        assertThat(response.departmentName()).isEqualTo("Bilgisayar Muhendisligi");
        assertThat(response.facultyId()).isEqualTo(facultyId);
        assertThat(response.facultyName()).isEqualTo("Muhendislik Fakultesi");
        assertThat(response.academicianCount()).isEqualTo(10L);
        assertThat(response.courseCount()).isEqualTo(20L);
        assertThat(response.semester()).isEqualTo(semester);
        assertThat(response.academicPeriodId()).isEqualTo(periodId);
        assertThat(response.academicPeriodDisplayName()).isEqualTo("2026-2027 Güz");
        assertThat(response.classroomCount()).isEqualTo(5L);
        assertThat(response.scheduleSummary()).isEqualTo(mockScheduleResponse);
        assertThat(response.warnings()).containsExactly("3 dersin programı eksik.", "2 ders henüz programlanmamış.");

        verify(accessScopeService).requireDepartmentScope(currentUser);
        verify(academicianRepository).countByDepartment_Id(departmentId);
        verify(courseRepository).countByDepartment_Id(departmentId);
        verify(classroomRepository).findAllByFloorBuildingFacultyIdOrderByCodeAsc(facultyId);
        verify(weeklyScheduleService).getScheduleCompletion(currentUser, periodId);
        verify(academicPeriodRepository).findById(periodId);
    }
}
