package com.dts.dersliktakip.service;

import com.dts.dersliktakip.dto.CreateExtraLessonRequest;
import com.dts.dersliktakip.dto.CreateScheduleCancellationRequest;
import com.dts.dersliktakip.dto.CreateScheduleMakeupRequest;
import com.dts.dersliktakip.dto.ScheduleTimeConfigurationResponse;
import com.dts.dersliktakip.dto.ScheduleTimeSlotResponse;
import com.dts.dersliktakip.entity.Academician;
import com.dts.dersliktakip.entity.Building;
import com.dts.dersliktakip.entity.Classroom;
import com.dts.dersliktakip.entity.ClassroomType;
import com.dts.dersliktakip.entity.Course;
import com.dts.dersliktakip.entity.CourseType;
import com.dts.dersliktakip.entity.Department;
import com.dts.dersliktakip.entity.Faculty;
import com.dts.dersliktakip.entity.Floor;
import com.dts.dersliktakip.entity.Role;
import com.dts.dersliktakip.entity.ScheduleException;
import com.dts.dersliktakip.entity.ScheduleExceptionType;
import com.dts.dersliktakip.entity.Semester;
import com.dts.dersliktakip.entity.User;
import com.dts.dersliktakip.entity.WeeklySchedule;
import com.dts.dersliktakip.exception.ScheduleConflictException;
import com.dts.dersliktakip.repository.AcademicianRepository;
import com.dts.dersliktakip.repository.ClassroomRepository;
import com.dts.dersliktakip.repository.CourseRepository;
import com.dts.dersliktakip.repository.ScheduleExceptionRepository;
import com.dts.dersliktakip.repository.WeeklyScheduleRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ScheduleExceptionServiceTest {

    @Mock
    private ScheduleExceptionRepository scheduleExceptionRepository;

    @Mock
    private WeeklyScheduleRepository weeklyScheduleRepository;

    @Mock
    private CourseRepository courseRepository;

    @Mock
    private ClassroomRepository classroomRepository;

    @Mock
    private AcademicianRepository academicianRepository;

    @Mock
    private WeeklyScheduleService weeklyScheduleService;

    @Mock
    private AccessScopeService accessScopeService;

    @InjectMocks
    private ScheduleExceptionService scheduleExceptionService;

    @Test
    void createExtraLessonRejectsCourseOwnedByAnotherAcademician() {
        // Arrange: BR-08, TC-019-02, TD-INVALID-015
        TestFixture fixture = fixture();
        Course foreignCourse = course(fixture.department, academician(fixture.department));

        when(academicianRepository.findByEmail(fixture.currentUser.getEmail())).thenReturn(Optional.of(fixture.academician));
        when(courseRepository.findById(foreignCourse.getId())).thenReturn(Optional.of(foreignCourse));

        CreateExtraLessonRequest request = new CreateExtraLessonRequest(
                foreignCourse.getId(),
                LocalDate.of(2026, 9, 14),
                "08:15-09:00",
                1,
                fixture.classroom.getId()
        );

        // Act / Assert
        assertThatThrownBy(() -> scheduleExceptionService.createExtraLesson(request, fixture.currentUser))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage("Bu ders için işlem yapma yetkiniz yok.");
        verify(weeklyScheduleService, never()).getTimeConfiguration(any());
        verify(scheduleExceptionRepository, never()).save(any());
    }

    @Test
    void createExtraLessonRejectsWeekendDate() {
        // Arrange: BR-09, TC-019-03, TD-SPECIAL-004
        TestFixture fixture = fixture();
        stubOwnedCourseFlow(fixture);
        when(weeklyScheduleService.getTimeConfiguration(fixture.currentUser)).thenReturn(timeConfiguration(fixture.department));
        when(classroomRepository.findById(fixture.classroom.getId())).thenReturn(Optional.of(fixture.classroom));
        when(scheduleExceptionRepository.existsByCourse_IdAndTargetDateAndTimeSlotAndType(
                fixture.course.getId(),
                LocalDate.of(2026, 9, 19),
                "08:15-09:00",
                ScheduleExceptionType.EXTRA
        )).thenReturn(false);

        CreateExtraLessonRequest request = new CreateExtraLessonRequest(
                fixture.course.getId(),
                LocalDate.of(2026, 9, 19),
                "08:15-09:00",
                1,
                fixture.classroom.getId()
        );

        // Act / Assert
        assertThatThrownBy(() -> scheduleExceptionService.createExtraLesson(request, fixture.currentUser))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Hafta sonu için ders istisnası oluşturulamaz.");
        verify(scheduleExceptionRepository, never()).save(any());
    }

    @Test
    void cancelLessonRejectsDuplicateCancellation() {
        // Arrange: BR-11, TC-021-02, TD-SPECIAL-005
        TestFixture fixture = fixture();
        WeeklySchedule schedule = schedule(fixture.course, fixture.classroom, "MONDAY", "08:15-09:00");
        LocalDate monday = LocalDate.of(2026, 9, 14);

        when(academicianRepository.findByEmail(fixture.currentUser.getEmail())).thenReturn(Optional.of(fixture.academician));
        when(weeklyScheduleRepository.findWithDetailsById(schedule.getId())).thenReturn(Optional.of(schedule));
        when(scheduleExceptionRepository.existsByOriginalSchedule_IdAndOriginalDateAndType(schedule.getId(), monday, ScheduleExceptionType.CANCELLED))
                .thenReturn(true);

        // Act / Assert
        assertThatThrownBy(() -> scheduleExceptionService.cancelLesson(new CreateScheduleCancellationRequest(schedule.getId(), monday), fixture.currentUser))
                .isInstanceOf(ScheduleConflictException.class)
                .hasMessage("Ders zaten iptal edilmiş.")
                .satisfies(exception -> assertThat(((ScheduleConflictException) exception).getCode()).isEqualTo("DUPLICATE_EXCEPTION"));
        verify(scheduleExceptionRepository, never()).save(any());
    }

    @Test
    void createMakeupRejectsDuplicateForSameOriginalScheduleAndDate() {
        // Arrange: BR-10, TC-020-02, TD-SPECIAL-005
        TestFixture fixture = fixture();
        WeeklySchedule schedule = schedule(fixture.course, fixture.classroom, "MONDAY", "08:15-09:00");
        LocalDate originalMonday = LocalDate.of(2026, 9, 14);

        when(academicianRepository.findByEmail(fixture.currentUser.getEmail())).thenReturn(Optional.of(fixture.academician));
        when(weeklyScheduleRepository.findWithDetailsById(schedule.getId())).thenReturn(Optional.of(schedule));
        when(weeklyScheduleService.getTimeConfiguration(fixture.currentUser)).thenReturn(timeConfiguration(fixture.department));
        when(classroomRepository.findById(fixture.classroom.getId())).thenReturn(Optional.of(fixture.classroom));
        when(scheduleExceptionRepository.existsByOriginalSchedule_IdAndOriginalDateAndTypeIn(
                schedule.getId(),
                originalMonday,
                List.of(ScheduleExceptionType.MAKEUP)
        )).thenReturn(true);

        CreateScheduleMakeupRequest request = new CreateScheduleMakeupRequest(
                schedule.getId(),
                originalMonday,
                LocalDate.of(2026, 9, 16),
                "09:10-09:55",
                1,
                fixture.classroom.getId()
        );

        // Act / Assert
        assertThatThrownBy(() -> scheduleExceptionService.createMakeup(request, fixture.currentUser))
                .isInstanceOf(ScheduleConflictException.class)
                .hasMessage("Bu ders için telafi zaten oluşturulmuş.")
                .satisfies(exception -> assertThat(((ScheduleConflictException) exception).getCode()).isEqualTo("DUPLICATE_EXCEPTION"));
        verify(scheduleExceptionRepository, never()).save(any());
    }

    @Test
    void createExtraLessonRejectsClassroomConflictAtTargetSlot() {
        // Arrange: TC-020-03, TD-COMBO-001
        TestFixture fixture = fixture();
        WeeklySchedule conflict = schedule(course(fixture.department, academician(fixture.department)), fixture.classroom, "MONDAY", "08:15-09:00");
        LocalDate monday = LocalDate.of(2026, 9, 14);

        stubOwnedCourseFlow(fixture);
        when(weeklyScheduleService.getTimeConfiguration(fixture.currentUser)).thenReturn(timeConfiguration(fixture.department));
        when(classroomRepository.findById(fixture.classroom.getId())).thenReturn(Optional.of(fixture.classroom));
        when(scheduleExceptionRepository.existsByCourse_IdAndTargetDateAndTimeSlotAndType(fixture.course.getId(), monday, "08:15-09:00", ScheduleExceptionType.EXTRA))
                .thenReturn(false);
        when(scheduleExceptionRepository.findAllByTargetDate(monday)).thenReturn(List.of());
        when(weeklyScheduleRepository.findAllByClassroom_IdAndDayOfWeekAndTimeSlot(fixture.classroom.getId(), "MONDAY", "08:15-09:00"))
                .thenReturn(List.of(conflict));
        when(weeklyScheduleRepository.findAllByCourse_Academician_IdAndDayOfWeekAndTimeSlot(fixture.course.getAcademician().getId(), "MONDAY", "08:15-09:00"))
                .thenReturn(List.of());
        when(weeklyScheduleRepository.findAllByCourse_Department_IdAndCourse_GradeAndDayOfWeekAndTimeSlot(fixture.department.getId(), fixture.course.getGrade(), "MONDAY", "08:15-09:00"))
                .thenReturn(List.of());

        CreateExtraLessonRequest request = new CreateExtraLessonRequest(
                fixture.course.getId(),
                monday,
                "08:15-09:00",
                1,
                fixture.classroom.getId()
        );

        // Act / Assert
        assertThatThrownBy(() -> scheduleExceptionService.createExtraLesson(request, fixture.currentUser))
                .isInstanceOf(ScheduleConflictException.class)
                .hasMessage("Bu saate ders eklenemez.")
                .satisfies(exception -> assertThat(((ScheduleConflictException) exception).getCode()).isEqualTo("CLASSROOM_CONFLICT"));
        verify(scheduleExceptionRepository, never()).save(any());
    }

    @Test
    void createExtraLessonChecksEachSelectedSlotAndPersistsWhenTargetIsAvailable() {
        // Arrange: BR-04, TC-015-01, TD-COMBO-004
        TestFixture fixture = fixture();
        LocalDate monday = LocalDate.of(2026, 9, 14);

        stubOwnedCourseFlow(fixture);
        when(weeklyScheduleService.getTimeConfiguration(fixture.currentUser)).thenReturn(timeConfiguration(fixture.department));
        when(classroomRepository.findById(fixture.classroom.getId())).thenReturn(Optional.of(fixture.classroom));
        when(scheduleExceptionRepository.existsByCourse_IdAndTargetDateAndTimeSlotAndType(fixture.course.getId(), monday, "08:15-09:00", ScheduleExceptionType.EXTRA))
                .thenReturn(false);
        when(scheduleExceptionRepository.findAllByTargetDate(monday)).thenReturn(List.of());
        when(weeklyScheduleRepository.findAllByClassroom_IdAndDayOfWeekAndTimeSlot(any(), any(), any())).thenReturn(List.of());
        when(weeklyScheduleRepository.findAllByCourse_Academician_IdAndDayOfWeekAndTimeSlot(any(), any(), any())).thenReturn(List.of());
        when(weeklyScheduleRepository.findAllByCourse_Department_IdAndCourse_GradeAndDayOfWeekAndTimeSlot(any(), anyInt(), any(), any())).thenReturn(List.of());
        when(scheduleExceptionRepository.save(any(ScheduleException.class))).thenAnswer(invocation -> {
            ScheduleException saved = invocation.getArgument(0);
            saved.setId(UUID.randomUUID());
            return saved;
        });

        CreateExtraLessonRequest request = new CreateExtraLessonRequest(
                fixture.course.getId(),
                monday,
                "08:15-09:00",
                2,
                fixture.classroom.getId()
        );

        // Act
        scheduleExceptionService.createExtraLesson(request, fixture.currentUser);

        // Assert
        ArgumentCaptor<ScheduleException> exceptionCaptor = ArgumentCaptor.forClass(ScheduleException.class);
        verify(weeklyScheduleRepository, times(2)).findAllByClassroom_IdAndDayOfWeekAndTimeSlot(any(), any(), any());
        verify(weeklyScheduleRepository, times(2)).findAllByCourse_Academician_IdAndDayOfWeekAndTimeSlot(any(), any(), any());
        verify(weeklyScheduleRepository, times(2)).findAllByCourse_Department_IdAndCourse_GradeAndDayOfWeekAndTimeSlot(any(), anyInt(), any(), any());
        verify(scheduleExceptionRepository, times(1)).save(exceptionCaptor.capture());

        ScheduleException savedException = exceptionCaptor.getValue();
        assertThat(savedException.getType()).isEqualTo(ScheduleExceptionType.EXTRA);
        assertThat(savedException.getCourse()).isSameAs(fixture.course);
        assertThat(savedException.getAcademician()).isSameAs(fixture.academician);
        assertThat(savedException.getClassroom()).isSameAs(fixture.classroom);
        assertThat(savedException.getTimeSlot()).isEqualTo("08:15-09:00");
        assertThat(savedException.getSlotCount()).isEqualTo(2);
    }

    private void stubOwnedCourseFlow(TestFixture fixture) {
        when(academicianRepository.findByEmail(fixture.currentUser.getEmail())).thenReturn(Optional.of(fixture.academician));
        when(courseRepository.findById(fixture.course.getId())).thenReturn(Optional.of(fixture.course));
    }

    private static TestFixture fixture() {
        Faculty faculty = new Faculty();
        faculty.setId(UUID.randomUUID());
        faculty.setName("Muhendislik Fakultesi");
        faculty.setCode("MF");

        Department department = new Department();
        department.setId(UUID.randomUUID());
        department.setName("Bilgisayar Muhendisligi");
        department.setCode("CENG");
        department.setFaculty(faculty);

        Academician academician = academician(department);
        Course course = course(department, academician);
        Classroom classroom = classroom(faculty);

        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail("academician@dts.local");
        user.setRoles(Set.of(Role.ACADEMICIAN));

        return new TestFixture(user, academician, department, course, classroom);
    }

    private static Academician academician(Department department) {
        Academician academician = new Academician();
        academician.setId(UUID.randomUUID());
        academician.setFirstName("Ada");
        academician.setLastName("Lovelace");
        academician.setTitle("Dr.");
        academician.setEmail("academician@dts.local");
        academician.setDepartment(department);
        academician.setFaculty(department.getFaculty());
        return academician;
    }

    private static Course course(Department department, Academician academician) {
        Course course = new Course();
        course.setId(UUID.randomUUID());
        course.setCode("CENG101");
        course.setName("Programlamaya Giris");
        course.setDepartment(department);
        course.setFaculty(department.getFaculty());
        course.setAcademician(academician);
        course.setCourseType(CourseType.ZORUNLU);
        course.setSemester(Semester.GUZ);
        course.setGrade(1);
        course.setStudentCount(40);
        course.setTheoreticalHours(2);
        course.setPracticalHours(0);
        course.setActive(true);
        return course;
    }

    private static Classroom classroom(Faculty faculty) {
        Building building = new Building();
        building.setId(UUID.randomUUID());
        building.setFaculty(faculty);

        Floor floor = new Floor();
        floor.setId(UUID.randomUUID());
        floor.setBuilding(building);

        Classroom classroom = new Classroom();
        classroom.setId(UUID.randomUUID());
        classroom.setCode("D101");
        classroom.setName("D101");
        classroom.setCapacity(60);
        classroom.setType(ClassroomType.CLASSROOM);
        classroom.setFloor(floor);
        return classroom;
    }

    private static WeeklySchedule schedule(Course course, Classroom classroom, String dayOfWeek, String timeSlot) {
        WeeklySchedule schedule = new WeeklySchedule();
        schedule.setId(UUID.randomUUID());
        schedule.setCourse(course);
        schedule.setClassroom(classroom);
        schedule.setDayOfWeek(dayOfWeek);
        schedule.setTimeSlot(timeSlot);
        return schedule;
    }

    private static ScheduleTimeConfigurationResponse timeConfiguration(Department department) {
        return new ScheduleTimeConfigurationResponse(
                department.getId(),
                department.getName(),
                "08:15",
                "17:00",
                45,
                10,
                true,
                "12:00",
                "13:00",
                List.of(
                        new ScheduleTimeSlotResponse("08:15-09:00", "08:15", "09:00", 0),
                        new ScheduleTimeSlotResponse("09:10-09:55", "09:10", "09:55", 1),
                        new ScheduleTimeSlotResponse("10:05-10:50", "10:05", "10:50", 2)
                ),
                0
        );
    }

    private record TestFixture(
            User currentUser,
            Academician academician,
            Department department,
            Course course,
            Classroom classroom
    ) {
    }
}
