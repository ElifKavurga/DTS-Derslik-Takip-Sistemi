package com.dts.dersliktakip.service;

import com.dts.dersliktakip.dto.CourseResponse;
import com.dts.dersliktakip.dto.CreateCourseRequest;
import com.dts.dersliktakip.entity.Academician;
import com.dts.dersliktakip.entity.Course;
import com.dts.dersliktakip.entity.CourseType;
import com.dts.dersliktakip.entity.Department;
import com.dts.dersliktakip.entity.Faculty;
import com.dts.dersliktakip.entity.Semester;
import com.dts.dersliktakip.entity.User;
import com.dts.dersliktakip.mapper.CourseMapper;
import com.dts.dersliktakip.repository.AcademicianRepository;
import com.dts.dersliktakip.repository.CourseRepository;
import com.dts.dersliktakip.repository.DepartmentRepository;
import com.dts.dersliktakip.repository.FacultyRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CourseServiceTest {

    @Mock
    private CourseRepository courseRepository;

    @Mock
    private FacultyRepository facultyRepository;

    @Mock
    private DepartmentRepository departmentRepository;

    @Mock
    private AcademicianRepository academicianRepository;

    @Mock
    private CourseMapper courseMapper;

    @Mock
    private AccessScopeService accessScopeService;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private CourseService courseService;

    @Test
    void departmentAdminCreateCourseUsesAuthenticatedDepartmentScope() {
        User currentUser = new User();
        Faculty scopedFaculty = faculty(UUID.randomUUID(), "Muhendislik Fakultesi");
        Department scopedDepartment = department(UUID.randomUUID(), "Bilgisayar Muhendisligi", scopedFaculty);
        Academician academician = academician(UUID.randomUUID(), scopedDepartment);
        CreateCourseRequest request = createRequest(UUID.randomUUID(), UUID.randomUUID(), academician.getId(), "blm101");

        when(accessScopeService.isSuperAdmin(currentUser)).thenReturn(false);
        when(accessScopeService.requireDepartmentScope(currentUser)).thenReturn(scopedDepartment);
        when(courseRepository.existsByCodeIgnoreCase("BLM101")).thenReturn(false);
        when(academicianRepository.findById(academician.getId())).thenReturn(Optional.of(academician));
        when(courseRepository.save(any(Course.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(courseMapper.toResponse(any(Course.class))).thenReturn(courseResponse(scopedFaculty, scopedDepartment, academician));

        courseService.createCourse(request, currentUser);

        ArgumentCaptor<Course> courseCaptor = ArgumentCaptor.forClass(Course.class);
        verify(courseRepository).save(courseCaptor.capture());
        Course savedCourse = courseCaptor.getValue();
        assertThat(savedCourse.getCode()).isEqualTo("BLM101");
        assertThat(savedCourse.getFaculty()).isSameAs(scopedFaculty);
        assertThat(savedCourse.getDepartment()).isSameAs(scopedDepartment);
        verify(facultyRepository, never()).findById(any());
        verify(departmentRepository, never()).findById(any());
    }

    @Test
    void createCourseRejectsDuplicateCodeIgnoringCase() {
        User currentUser = new User();
        Faculty scopedFaculty = faculty(UUID.randomUUID(), "Muhendislik Fakultesi");
        Department scopedDepartment = department(UUID.randomUUID(), "Bilgisayar Muhendisligi", scopedFaculty);
        UUID academicianId = UUID.randomUUID();
        CreateCourseRequest request = createRequest(null, null, academicianId, "blm101");

        when(accessScopeService.isSuperAdmin(currentUser)).thenReturn(false);
        when(accessScopeService.requireDepartmentScope(currentUser)).thenReturn(scopedDepartment);
        when(courseRepository.existsByCodeIgnoreCase("BLM101")).thenReturn(true);

        assertThatThrownBy(() -> courseService.createCourse(request, currentUser))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Bu ders kodu zaten kullanılıyor");
        verify(courseRepository, never()).save(any());
        verify(academicianRepository, never()).findById(any());
    }

    private static CreateCourseRequest createRequest(UUID facultyId, UUID departmentId, UUID academicianId, String code) {
        return new CreateCourseRequest(
                code,
                "Programlamaya Giris",
                facultyId,
                departmentId,
                academicianId,
                2,
                1,
                4,
                3,
                CourseType.ZORUNLU,
                Semester.GUZ,
                1,
                true
        );
    }

    private static Faculty faculty(UUID id, String name) {
        Faculty faculty = new Faculty();
        faculty.setId(id);
        faculty.setName(name);
        return faculty;
    }

    private static Department department(UUID id, String name, Faculty faculty) {
        Department department = new Department();
        department.setId(id);
        department.setName(name);
        department.setFaculty(faculty);
        return department;
    }

    private static Academician academician(UUID id, Department department) {
        Academician academician = new Academician();
        academician.setId(id);
        academician.setDepartment(department);
        return academician;
    }

    private static CourseResponse courseResponse(Faculty faculty, Department department, Academician academician) {
        return new CourseResponse(
                UUID.randomUUID(),
                "BLM101",
                "Programlamaya Giris",
                faculty.getId(),
                faculty.getName(),
                department.getId(),
                department.getName(),
                academician.getId(),
                "Dr. Akademisyen",
                2,
                1,
                4,
                3,
                CourseType.ZORUNLU,
                Semester.GUZ,
                1,
                true
        );
    }
}
