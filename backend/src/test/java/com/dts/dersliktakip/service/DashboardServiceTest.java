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

    @InjectMocks
    private DashboardService dashboardService;

    @Test
    void departmentAdminDashboardUsesAuthenticatedUsersDepartmentScope() {
        UUID facultyId = UUID.randomUUID();
        UUID departmentId = UUID.randomUUID();
        User currentUser = new User();

        Faculty faculty = new Faculty();
        faculty.setId(facultyId);
        faculty.setName("Muhendislik Fakultesi");

        Department department = new Department();
        department.setId(departmentId);
        department.setName("Bilgisayar Muhendisligi");
        department.setCode("BM");
        department.setFaculty(faculty);

        when(accessScopeService.requireDepartmentScope(currentUser)).thenReturn(department);
        when(academicianRepository.countByDepartment_Id(departmentId)).thenReturn(10L);
        when(courseRepository.countByDepartment_Id(departmentId)).thenReturn(20L);

        DepartmentAdminDashboardResponse response = dashboardService.getDepartmentAdminDashboard(currentUser);

        assertThat(response.departmentId()).isEqualTo(departmentId);
        assertThat(response.departmentName()).isEqualTo("Bilgisayar Muhendisligi");
        assertThat(response.facultyId()).isEqualTo(facultyId);
        assertThat(response.facultyName()).isEqualTo("Muhendislik Fakultesi");
        assertThat(response.academicianCount()).isEqualTo(10L);
        assertThat(response.courseCount()).isEqualTo(20L);
        verify(accessScopeService).requireDepartmentScope(currentUser);
        verify(academicianRepository).countByDepartment_Id(departmentId);
        verify(courseRepository).countByDepartment_Id(departmentId);
    }
}
