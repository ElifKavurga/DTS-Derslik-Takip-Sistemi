package com.dts.dersliktakip.service;

import com.dts.dersliktakip.dto.CourseResponse;
import com.dts.dersliktakip.dto.CreateCourseRequest;
import com.dts.dersliktakip.dto.UpdateCourseRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.dts.dersliktakip.entity.Academician;
import com.dts.dersliktakip.entity.AcademicPeriod;
import com.dts.dersliktakip.entity.Course;
import com.dts.dersliktakip.entity.CourseType;
import com.dts.dersliktakip.entity.Department;
import com.dts.dersliktakip.entity.Faculty;
import com.dts.dersliktakip.entity.Role;
import com.dts.dersliktakip.entity.Semester;
import com.dts.dersliktakip.entity.TermType;
import com.dts.dersliktakip.entity.User;
import com.dts.dersliktakip.mapper.CourseMapper;
import com.dts.dersliktakip.repository.AcademicPeriodRepository;
import com.dts.dersliktakip.repository.AcademicianRepository;
import com.dts.dersliktakip.repository.CourseRepository;
import com.dts.dersliktakip.repository.DepartmentRepository;
import com.dts.dersliktakip.repository.FacultyRepository;
import com.dts.dersliktakip.repository.WeeklyScheduleRepository;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
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
    private WeeklyScheduleRepository weeklyScheduleRepository;

    @Mock
    private CourseMapper courseMapper;

    @Mock
    private AccessScopeService accessScopeService;

    @Mock
    private NotificationService notificationService;

    @Mock
    private AcademicPeriodRepository academicPeriodRepository;

    @InjectMocks
    private CourseService courseService;

    @Test
    void departmentAdminCreateCourseUsesAuthenticatedDepartmentScope() {
        User currentUser = new User();
        Faculty scopedFaculty = faculty(UUID.randomUUID(), "Muhendislik Fakultesi");
        Department scopedDepartment = department(UUID.randomUUID(), "Bilgisayar Muhendisligi", scopedFaculty);
        Academician academician = academician(UUID.randomUUID(), scopedDepartment);
        CreateCourseRequest request = createRequest(UUID.randomUUID(), UUID.randomUUID(), academician.getId(), "blm101");
        AcademicPeriod period = academicPeriod(request.academicPeriodId());

        when(accessScopeService.isSuperAdmin(currentUser)).thenReturn(false);
        when(accessScopeService.requireDepartmentScope(currentUser)).thenReturn(scopedDepartment);
        when(courseRepository.existsByCodeIgnoreCase("BLM101")).thenReturn(false);
        when(academicianRepository.findById(academician.getId())).thenReturn(Optional.of(academician));
        when(academicPeriodRepository.findById(request.academicPeriodId())).thenReturn(Optional.of(period));
        when(courseRepository.save(any(Course.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(courseMapper.toResponse(any(Course.class))).thenReturn(courseResponse(scopedFaculty, scopedDepartment, academician));

        courseService.createCourse(request, currentUser);

        ArgumentCaptor<Course> courseCaptor = ArgumentCaptor.forClass(Course.class);
        InOrder order = inOrder(courseRepository, notificationService, courseMapper);
        order.verify(courseRepository, times(1)).save(courseCaptor.capture());
        order.verify(notificationService, times(1)).createForUser(
                eq(currentUser),
                eq("Yeni ders oluşturuldu"),
                eq("BLM101 - Programlamaya Giris sisteme eklendi."),
                eq("/department-admin/dersler")
        );
        order.verify(courseMapper, times(1)).toResponse(courseCaptor.getValue());
        Course savedCourse = courseCaptor.getValue();
        assertThat(savedCourse.getCode()).isEqualTo("BLM101");
        assertThat(savedCourse.getFaculty()).isSameAs(scopedFaculty);
        assertThat(savedCourse.getDepartment()).isSameAs(scopedDepartment);
        assertThat(savedCourse.getStudentCount()).isEqualTo(72);
        assertThat(savedCourse.getAcademicPeriod()).isSameAs(period);
        assertThat(savedCourse.getSemester()).isEqualTo(Semester.GUZ);
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
        verifyNoInteractions(notificationService, courseMapper, academicPeriodRepository);
    }

    @ParameterizedTest
    @ValueSource(ints = {0, 1, 72, 300})
    void createCourseRequestAcceptsNonNegativeStudentCount(int studentCount) {
        Validator validator = Validation.buildDefaultValidatorFactory().getValidator();
        CreateCourseRequest request = createRequest(null, null, UUID.randomUUID(), "blm101", studentCount);

        assertThat(validator.validate(request))
                .noneMatch(violation -> violation.getPropertyPath().toString().equals("studentCount"));
    }

    @Test
    void createCourseRequestRejectsNegativeStudentCount() {
        Validator validator = Validation.buildDefaultValidatorFactory().getValidator();
        CreateCourseRequest request = createRequest(null, null, UUID.randomUUID(), "blm101", -1);

        assertThat(validator.validate(request))
                .anyMatch(violation -> violation.getPropertyPath().toString().equals("studentCount")
                        && violation.getMessage().equals("Ders mevcudu 0'dan küçük olamaz."));
    }

    @Test
    void createCourseRequestRejectsDecimalStudentCount() {
        String json = """
                {
                  "code": "blm101",
                  "name": "Programlamaya Giris",
                  "academicianId": "%s",
                  "theoreticalHours": 2,
                  "practicalHours": 1,
                  "ects": 4,
                  "credits": 3,
                  "studentCount": 72.5,
                  "courseType": "ZORUNLU",
                  "semester": "GUZ",
                  "grade": 1,
                  "active": true
                }
                """.formatted(UUID.randomUUID());

        ObjectMapper strictMapper = new ObjectMapper();
        strictMapper.coercionConfigFor(com.fasterxml.jackson.databind.type.LogicalType.Integer)
                .setCoercion(com.fasterxml.jackson.databind.cfg.CoercionInputShape.Float, com.fasterxml.jackson.databind.cfg.CoercionAction.Fail);
        assertThatThrownBy(() -> strictMapper.readValue(json, CreateCourseRequest.class))
                .isInstanceOf(Exception.class);
    }

    @Test
    void updateCoursePersistsStudentCount() {
        User currentUser = new User();
        Faculty scopedFaculty = faculty(UUID.randomUUID(), "Muhendislik Fakultesi");
        Department scopedDepartment = department(UUID.randomUUID(), "Bilgisayar Muhendisligi", scopedFaculty);
        Academician academician = academician(UUID.randomUUID(), scopedDepartment);
        Course course = course(scopedFaculty, scopedDepartment, academician);
        course.setStudentCount(72);
        UpdateCourseRequest request = updateRequest(null, null, academician.getId(), "blm101", 80);
        AcademicPeriod period = academicPeriod(request.academicPeriodId());

        when(courseRepository.findById(course.getId())).thenReturn(Optional.of(course));
        when(accessScopeService.isSuperAdmin(currentUser)).thenReturn(false);
        when(accessScopeService.requireDepartmentScope(currentUser)).thenReturn(scopedDepartment);
        when(courseRepository.existsByCodeIgnoreCaseAndIdNot("BLM101", course.getId())).thenReturn(false);
        when(academicianRepository.findById(academician.getId())).thenReturn(Optional.of(academician));
        when(academicPeriodRepository.findById(request.academicPeriodId())).thenReturn(Optional.of(period));
        when(courseRepository.save(any(Course.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(courseMapper.toResponse(any(Course.class))).thenReturn(courseResponse(scopedFaculty, scopedDepartment, academician));

        courseService.updateCourse(course.getId(), request, currentUser);

        ArgumentCaptor<Course> courseCaptor = ArgumentCaptor.forClass(Course.class);
        verify(courseRepository, times(1)).save(courseCaptor.capture());
        assertThat(courseCaptor.getValue().getStudentCount()).isEqualTo(80);
        assertThat(courseCaptor.getValue().getAcademicPeriod()).isSameAs(period);
        verify(notificationService, never()).createForUser(any(), any(), any(), any());
    }

    @Test
    void departmentAdminCannotUpdateCourseOutsideDepartmentScope() {
        User currentUser = new User();
        currentUser.setRoles(Set.of(Role.DEPARTMENT_ADMIN));
        Faculty faculty = faculty(UUID.randomUUID(), "Muhendislik Fakultesi");
        Department ownDepartment = department(UUID.randomUUID(), "Bilgisayar Muhendisligi", faculty);
        Department otherDepartment = department(UUID.randomUUID(), "Elektrik Elektronik Muhendisligi", faculty);
        Academician academician = academician(UUID.randomUUID(), otherDepartment);
        Course course = course(faculty, otherDepartment, academician);
        UpdateCourseRequest request = updateRequest(null, null, academician.getId(), "blm101", 80);

        when(courseRepository.findById(course.getId())).thenReturn(Optional.of(course));
        when(accessScopeService.isSuperAdmin(currentUser)).thenReturn(false);
        when(accessScopeService.requireDepartmentScope(currentUser)).thenReturn(ownDepartment);

        assertThatThrownBy(() -> courseService.updateCourse(course.getId(), request, currentUser))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage("Bu ders icin yetkiniz yok.");
        verify(courseRepository, never()).save(any());
        verifyNoInteractions(notificationService, courseMapper, academicPeriodRepository);
    }

    private static CreateCourseRequest createRequest(UUID facultyId, UUID departmentId, UUID academicianId, String code) {
        return createRequest(facultyId, departmentId, academicianId, code, 72);
    }

    private static CreateCourseRequest createRequest(UUID facultyId, UUID departmentId, UUID academicianId, String code, int studentCount) {
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
                studentCount,
                CourseType.ZORUNLU,
                Semester.GUZ,
                UUID.randomUUID(),
                1,
                true
        );
    }

    private static UpdateCourseRequest updateRequest(UUID facultyId, UUID departmentId, UUID academicianId, String code, int studentCount) {
        return new UpdateCourseRequest(
                code,
                "Programlamaya Giris",
                facultyId,
                departmentId,
                academicianId,
                2,
                1,
                4,
                3,
                studentCount,
                CourseType.ZORUNLU,
                Semester.GUZ,
                UUID.randomUUID(),
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

    private static Course course(Faculty faculty, Department department, Academician academician) {
        Course course = new Course();
        course.setId(UUID.randomUUID());
        course.setCode("BLM101");
        course.setName("Programlamaya Giris");
        course.setFaculty(faculty);
        course.setDepartment(department);
        course.setAcademician(academician);
        return course;
    }

    private static AcademicPeriod academicPeriod(UUID id) {
        AcademicPeriod period = new AcademicPeriod();
        period.setId(id);
        period.setAcademicYear("2026-2027");
        period.setTermType(TermType.FALL);
        period.setDisplayName("2026-2027 Güz");
        period.setActive(true);
        return period;
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
                72,
                CourseType.ZORUNLU,
                Semester.GUZ,
                UUID.randomUUID(),
                "2026-2027 Güz",
                1,
                true
        );
    }
}
