package com.dts.dersliktakip.service;

import com.dts.dersliktakip.dto.CreateWeeklyScheduleRequest;
import com.dts.dersliktakip.dto.AvailableClassroomResponse;
import com.dts.dersliktakip.dto.ScheduleCompletionResponse;
import com.dts.dersliktakip.entity.Academician;
import com.dts.dersliktakip.entity.Building;
import com.dts.dersliktakip.entity.Classroom;
import com.dts.dersliktakip.entity.ClassroomType;
import com.dts.dersliktakip.entity.Course;
import com.dts.dersliktakip.entity.CourseType;
import com.dts.dersliktakip.entity.Department;
import com.dts.dersliktakip.entity.Faculty;
import com.dts.dersliktakip.entity.Floor;
import com.dts.dersliktakip.entity.Semester;
import com.dts.dersliktakip.entity.User;
import com.dts.dersliktakip.entity.WeeklySchedule;
import com.dts.dersliktakip.exception.ScheduleConflictException;
import com.dts.dersliktakip.repository.ClassroomRepository;
import com.dts.dersliktakip.repository.CourseRepository;
import com.dts.dersliktakip.repository.DepartmentScheduleConfigRepository;
import com.dts.dersliktakip.repository.AcademicianRepository;
import com.dts.dersliktakip.repository.WeeklyScheduleRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;

@ExtendWith(MockitoExtension.class)
class WeeklyScheduleServiceTest {

    @Mock
    private WeeklyScheduleRepository weeklyScheduleRepository;

    @Mock
    private CourseRepository courseRepository;

    @Mock
    private ClassroomRepository classroomRepository;

    @Mock
    private DepartmentScheduleConfigRepository departmentScheduleConfigRepository;

    @Mock
    private AccessScopeService accessScopeService;

    @Mock
    private AcademicianRepository academicianRepository;

    @InjectMocks
    private WeeklyScheduleService weeklyScheduleService;

    @Test
    void createScheduleRejectsCourseOutsideAuthenticatedDepartment() {
        User currentUser = new User();
        Department scopedDepartment = department(UUID.randomUUID(), faculty(UUID.randomUUID()));
        Department otherDepartment = department(UUID.randomUUID(), scopedDepartment.getFaculty());
        Course foreignCourse = course(UUID.randomUUID(), otherDepartment);
        CreateWeeklyScheduleRequest request = new CreateWeeklyScheduleRequest(foreignCourse.getId(), UUID.randomUUID(), "MONDAY", "10:05-10:50", 1);

        when(accessScopeService.requireDepartmentScope(currentUser)).thenReturn(scopedDepartment);
        when(courseRepository.findById(foreignCourse.getId())).thenReturn(Optional.of(foreignCourse));

        assertThatThrownBy(() -> weeklyScheduleService.createSchedule(request, currentUser))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage("Bu ders için program oluşturma yetkiniz yok.");
        verify(classroomRepository, never()).findById(request.classroomId());
        verify(weeklyScheduleRepository, never()).saveAll(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void createScheduleRejectsInactiveCourse() {
        User currentUser = new User();
        Department department = department(UUID.randomUUID(), faculty(UUID.randomUUID()));
        Course inactiveCourse = course(UUID.randomUUID(), department);
        inactiveCourse.setActive(false);
        CreateWeeklyScheduleRequest request = new CreateWeeklyScheduleRequest(inactiveCourse.getId(), UUID.randomUUID(), "MONDAY", "10:05-10:50", 1);

        when(accessScopeService.requireDepartmentScope(currentUser)).thenReturn(department);
        when(courseRepository.findById(inactiveCourse.getId())).thenReturn(Optional.of(inactiveCourse));

        assertThatThrownBy(() -> weeklyScheduleService.createSchedule(request, currentUser))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Pasif ders programa eklenemez.");
        verify(classroomRepository, never()).findById(request.classroomId());
        verify(weeklyScheduleRepository, never()).saveAll(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void createScheduleRejectsCourseWhenAcademicianBelongsToAnotherDepartment() {
        User currentUser = new User();
        Faculty faculty = faculty(UUID.randomUUID());
        Department department = department(UUID.randomUUID(), faculty);
        Department otherDepartment = department(UUID.randomUUID(), faculty);
        Course course = course(UUID.randomUUID(), department);
        course.getAcademician().setDepartment(otherDepartment);
        CreateWeeklyScheduleRequest request = new CreateWeeklyScheduleRequest(course.getId(), UUID.randomUUID(), "MONDAY", "10:05-10:50", 1);

        when(accessScopeService.requireDepartmentScope(currentUser)).thenReturn(department);
        when(courseRepository.findById(course.getId())).thenReturn(Optional.of(course));

        assertThatThrownBy(() -> weeklyScheduleService.createSchedule(request, currentUser))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Dersin akademisyen atamasi bolum ile uyumlu degil.");
        verify(classroomRepository, never()).findById(request.classroomId());
        verify(weeklyScheduleRepository, never()).saveAll(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void createScheduleRejectsClassroomConflictAcrossDepartments() {
        User currentUser = new User();
        Faculty faculty = faculty(UUID.randomUUID());
        Department scopedDepartment = department(UUID.randomUUID(), faculty);
        Department otherDepartment = department(UUID.randomUUID(), faculty);
        Course course = course(UUID.randomUUID(), scopedDepartment);
        Course conflictingCourse = course(UUID.randomUUID(), otherDepartment);
        Classroom classroom = classroom(UUID.randomUUID(), faculty);
        WeeklySchedule conflict = new WeeklySchedule();
        conflict.setCourse(conflictingCourse);
        conflict.setClassroom(classroom);
        conflict.setDayOfWeek("MONDAY");
        conflict.setTimeSlot("10:05-10:50");
        CreateWeeklyScheduleRequest request = new CreateWeeklyScheduleRequest(course.getId(), classroom.getId(), "MONDAY", "10:05-10:50", 1);

        when(accessScopeService.requireDepartmentScope(currentUser)).thenReturn(scopedDepartment);
        when(courseRepository.findById(course.getId())).thenReturn(Optional.of(course));
        when(classroomRepository.findById(classroom.getId())).thenReturn(Optional.of(classroom));
        when(departmentScheduleConfigRepository.findByDepartmentId(scopedDepartment.getId())).thenReturn(Optional.empty());
        when(weeklyScheduleRepository.findAllByCourse_Department_IdAndCourse_SemesterOrderByDayOfWeekAscTimeSlotAsc(scopedDepartment.getId(), Semester.GUZ))
                .thenReturn(List.of());
        when(weeklyScheduleRepository.findAllByClassroom_IdAndDayOfWeekAndTimeSlot(classroom.getId(), "MONDAY", "10:05-10:50"))
                .thenReturn(List.of(conflict));

        assertThatThrownBy(() -> weeklyScheduleService.createSchedule(request, currentUser))
                .isInstanceOf(ScheduleConflictException.class)
                .hasMessage("Bu saate ders koyulamaz.")
                .satisfies(exception -> {
                    ScheduleConflictException conflictException = (ScheduleConflictException) exception;
                    assertThat(conflictException.getCode()).isEqualTo("CLASSROOM_CONFLICT");
                    assertThat(conflictException.getDetails()).anyMatch(detail -> detail.contains(conflictingCourse.getCode()));
                });
        verify(weeklyScheduleRepository, never()).saveAll(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void createScheduleRejectsAcademicianConflict() {
        User currentUser = new User();
        Faculty faculty = faculty(UUID.randomUUID());
        Department department = department(UUID.randomUUID(), faculty);
        Course course = course(UUID.randomUUID(), department);
        Course conflictingCourse = course(UUID.randomUUID(), department);
        conflictingCourse.setAcademician(course.getAcademician());
        Classroom classroom = classroom(UUID.randomUUID(), faculty);
        WeeklySchedule conflict = schedule(conflictingCourse, classroom, "MONDAY", "10:05-10:50");
        CreateWeeklyScheduleRequest request = new CreateWeeklyScheduleRequest(course.getId(), classroom.getId(), "MONDAY", "10:05-10:50", 1);

        when(accessScopeService.requireDepartmentScope(currentUser)).thenReturn(department);
        when(courseRepository.findById(course.getId())).thenReturn(Optional.of(course));
        when(classroomRepository.findById(classroom.getId())).thenReturn(Optional.of(classroom));
        when(departmentScheduleConfigRepository.findByDepartmentId(department.getId())).thenReturn(Optional.empty());
        when(weeklyScheduleRepository.findAllByCourse_Department_IdAndCourse_SemesterOrderByDayOfWeekAscTimeSlotAsc(department.getId(), Semester.GUZ))
                .thenReturn(List.of());
        when(weeklyScheduleRepository.findAllByClassroom_IdAndDayOfWeekAndTimeSlot(classroom.getId(), "MONDAY", "10:05-10:50"))
                .thenReturn(List.of());
        when(weeklyScheduleRepository.findAllByCourse_Academician_IdAndDayOfWeekAndTimeSlot(course.getAcademician().getId(), "MONDAY", "10:05-10:50"))
                .thenReturn(List.of(conflict));

        assertThatThrownBy(() -> weeklyScheduleService.createSchedule(request, currentUser))
                .isInstanceOf(ScheduleConflictException.class)
                .hasMessage("Bu saate ders koyulamaz.")
                .satisfies(exception -> {
                    ScheduleConflictException conflictException = (ScheduleConflictException) exception;
                    assertThat(conflictException.getCode()).isEqualTo("ACADEMICIAN_CONFLICT");
                    assertThat(conflictException.getDetails()).anyMatch(detail -> detail.contains(conflictingCourse.getCode()));
                });
        verify(weeklyScheduleRepository, never()).saveAll(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void createScheduleRejectsRequiredCourseConflictForSameGrade() {
        User currentUser = new User();
        Faculty faculty = faculty(UUID.randomUUID());
        Department department = department(UUID.randomUUID(), faculty);
        Course course = course(UUID.randomUUID(), department, "CENG303", 3);
        Course conflictingCourse = course(UUID.randomUUID(), department, "CENG301", 3);
        Classroom classroom = classroom(UUID.randomUUID(), faculty);
        Classroom otherClassroom = classroom(UUID.randomUUID(), faculty);
        otherClassroom.setId(UUID.randomUUID());
        otherClassroom.setCode("D102");
        WeeklySchedule conflict = schedule(conflictingCourse, otherClassroom, "MONDAY", "10:05-10:50");
        CreateWeeklyScheduleRequest request = new CreateWeeklyScheduleRequest(course.getId(), classroom.getId(), "MONDAY", "10:05-10:50", 1);

        when(accessScopeService.requireDepartmentScope(currentUser)).thenReturn(department);
        when(courseRepository.findById(course.getId())).thenReturn(Optional.of(course));
        when(classroomRepository.findById(classroom.getId())).thenReturn(Optional.of(classroom));
        when(departmentScheduleConfigRepository.findByDepartmentId(department.getId())).thenReturn(Optional.empty());
        when(weeklyScheduleRepository.findAllByCourse_Department_IdAndCourse_SemesterOrderByDayOfWeekAscTimeSlotAsc(department.getId(), Semester.GUZ))
                .thenReturn(List.of());
        when(weeklyScheduleRepository.findAllByClassroom_IdAndDayOfWeekAndTimeSlot(classroom.getId(), "MONDAY", "10:05-10:50"))
                .thenReturn(List.of());
        when(weeklyScheduleRepository.findAllByCourse_Academician_IdAndDayOfWeekAndTimeSlot(course.getAcademician().getId(), "MONDAY", "10:05-10:50"))
                .thenReturn(List.of());
        when(weeklyScheduleRepository.findAllByCourse_Department_IdAndCourse_GradeAndDayOfWeekAndTimeSlot(department.getId(), course.getGrade(), "MONDAY", "10:05-10:50"))
                .thenReturn(List.of(conflict));

        assertThatThrownBy(() -> weeklyScheduleService.createSchedule(request, currentUser))
                .isInstanceOf(ScheduleConflictException.class)
                .hasMessage("Bu saate ders koyulamaz.")
                .satisfies(exception -> {
                    ScheduleConflictException conflictException = (ScheduleConflictException) exception;
                    assertThat(conflictException.getCode()).isEqualTo("STUDENT_GROUP_CONFLICT");
                    assertThat(conflictException.getDetails()).anyMatch(detail -> detail.contains(conflictingCourse.getCode()));
                });
        verify(weeklyScheduleRepository, never()).saveAll(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void availableClassroomsMarksEqualCapacityAsSuitable() {
        Department department = department(UUID.randomUUID(), faculty(UUID.randomUUID()));
        Course course = course(UUID.randomUUID(), department);
        course.setStudentCount(50);
        Classroom classroom = classroom(UUID.randomUUID(), department.getFaculty(), "D050", 50);

        mockAvailableClassroomQuery(new User(), department, course, List.of(classroom));

        List<AvailableClassroomResponse> response = weeklyScheduleService.getAvailableClassrooms(new User(), course.getId(), "MONDAY", "10:05-10:50", 1, null);

        assertThat(response).singleElement().satisfies(item -> {
            assertThat(item.capacitySufficient()).isTrue();
            assertThat(item.available()).isTrue();
            assertThat(item.selectable()).isTrue();
        });
    }

    @Test
    void availableClassroomsMarksHigherCapacityAsSuitable() {
        Department department = department(UUID.randomUUID(), faculty(UUID.randomUUID()));
        Course course = course(UUID.randomUUID(), department);
        course.setStudentCount(50);
        Classroom classroom = classroom(UUID.randomUUID(), department.getFaculty(), "D060", 60);

        mockAvailableClassroomQuery(new User(), department, course, List.of(classroom));

        List<AvailableClassroomResponse> response = weeklyScheduleService.getAvailableClassrooms(new User(), course.getId(), "MONDAY", "10:05-10:50", 1, null);

        assertThat(response).singleElement().satisfies(item -> {
            assertThat(item.capacitySufficient()).isTrue();
            assertThat(item.available()).isTrue();
            assertThat(item.selectable()).isTrue();
        });
    }

    @Test
    void availableClassroomsMarksLowerCapacityAsSelectableAlternative() {
        Department department = department(UUID.randomUUID(), faculty(UUID.randomUUID()));
        Course course = course(UUID.randomUUID(), department);
        course.setStudentCount(50);
        Classroom classroom = classroom(UUID.randomUUID(), department.getFaculty(), "D040", 40);

        mockAvailableClassroomQuery(new User(), department, course, List.of(classroom));

        List<AvailableClassroomResponse> response = weeklyScheduleService.getAvailableClassrooms(new User(), course.getId(), "MONDAY", "10:05-10:50", 1, null);

        assertThat(response).singleElement().satisfies(item -> {
            assertThat(item.capacitySufficient()).isFalse();
            assertThat(item.available()).isFalse();
            assertThat(item.selectable()).isTrue();
            assertThat(item.conflictCode()).isEqualTo("CAPACITY_CONFLICT");
        });
    }

    @Test
    void availableClassroomsSortsSuitableThenAlternativesByCapacityDistance() {
        Department department = department(UUID.randomUUID(), faculty(UUID.randomUUID()));
        Course course = course(UUID.randomUUID(), department);
        course.setStudentCount(50);
        List<Classroom> classrooms = List.of(
                classroom(UUID.randomUUID(), department.getFaculty(), "D040", 40),
                classroom(UUID.randomUUID(), department.getFaculty(), "D050", 50),
                classroom(UUID.randomUUID(), department.getFaculty(), "D060", 60),
                classroom(UUID.randomUUID(), department.getFaculty(), "D100", 100)
        );

        mockAvailableClassroomQuery(new User(), department, course, classrooms);

        List<AvailableClassroomResponse> response = weeklyScheduleService.getAvailableClassrooms(new User(), course.getId(), "MONDAY", "10:05-10:50", 1, null);

        assertThat(response).extracting(AvailableClassroomResponse::capacity)
                .containsExactly(50, 60, 100, 40);
    }

    @Test
    void availableClassroomsShowsAlternativesWhenNoSuitableCapacityExists() {
        Department department = department(UUID.randomUUID(), faculty(UUID.randomUUID()));
        Course course = course(UUID.randomUUID(), department);
        course.setStudentCount(50);
        List<Classroom> classrooms = List.of(
                classroom(UUID.randomUUID(), department.getFaculty(), "D030", 30),
                classroom(UUID.randomUUID(), department.getFaculty(), "D040", 40),
                classroom(UUID.randomUUID(), department.getFaculty(), "D045", 45)
        );

        mockAvailableClassroomQuery(new User(), department, course, classrooms);

        List<AvailableClassroomResponse> response = weeklyScheduleService.getAvailableClassrooms(new User(), course.getId(), "MONDAY", "10:05-10:50", 1, null);

        assertThat(response).allSatisfy(item -> {
            assertThat(item.capacitySufficient()).isFalse();
            assertThat(item.selectable()).isTrue();
        });
        assertThat(response).extracting(AvailableClassroomResponse::capacity)
                .containsExactly(45, 40, 30);
    }

    @Test
    void availableClassroomsSeparatesSuitableAndAlternativesForStudentCount72() {
        Department department = department(UUID.randomUUID(), faculty(UUID.randomUUID()));
        Course course = course(UUID.randomUUID(), department);
        course.setStudentCount(72);
        List<Classroom> classrooms = List.of(
                classroom(UUID.randomUUID(), department.getFaculty(), "A101", 75),
                classroom(UUID.randomUUID(), department.getFaculty(), "A102", 60),
                classroom(UUID.randomUUID(), department.getFaculty(), "A103", 50)
        );

        mockAvailableClassroomQuery(new User(), department, course, classrooms);

        List<AvailableClassroomResponse> response = weeklyScheduleService.getAvailableClassrooms(new User(), course.getId(), "MONDAY", "10:05-10:50", 1, null);

        assertThat(response).filteredOn(AvailableClassroomResponse::available)
                .extracting(AvailableClassroomResponse::capacity)
                .containsExactly(75);
        assertThat(response).filteredOn(item -> item.selectable() && Boolean.FALSE.equals(item.capacitySufficient()))
                .extracting(AvailableClassroomResponse::capacity)
                .containsExactly(60, 50);
    }

    @Test
    void availableClassroomsDoesNotMakeBusyClassroomSelectableEvenWhenCapacityIsSuitable() {
        Department department = department(UUID.randomUUID(), faculty(UUID.randomUUID()));
        Course course = course(UUID.randomUUID(), department);
        course.setStudentCount(50);
        Classroom classroom = classroom(UUID.randomUUID(), department.getFaculty(), "D060", 60);
        WeeklySchedule conflict = schedule(course(UUID.randomUUID(), department, "CENG202", 2), classroom, "MONDAY", "10:05-10:50");

        mockAvailableClassroomQuery(new User(), department, course, List.of(classroom));
        when(weeklyScheduleRepository.findAllByClassroom_IdAndDayOfWeekAndTimeSlot(classroom.getId(), "MONDAY", "10:05-10:50"))
                .thenReturn(List.of(conflict));

        List<AvailableClassroomResponse> response = weeklyScheduleService.getAvailableClassrooms(new User(), course.getId(), "MONDAY", "10:05-10:50", 1, null);

        assertThat(response).singleElement().satisfies(item -> {
            assertThat(item.capacitySufficient()).isTrue();
            assertThat(item.selectable()).isFalse();
            assertThat(item.conflictCode()).isEqualTo("CLASSROOM_CONFLICT");
        });
    }

    @Test
    void availableClassroomsChecksAllSlotsForMultiSlotSelection() {
        Department department = department(UUID.randomUUID(), faculty(UUID.randomUUID()));
        Course course = course(UUID.randomUUID(), department);
        course.setStudentCount(72);
        Classroom classroom = classroom(UUID.randomUUID(), department.getFaculty(), "A101", 75);
        WeeklySchedule conflict = schedule(course(UUID.randomUUID(), department, "CENG202", 2), classroom, "MONDAY", "09:10-09:55");

        mockAvailableClassroomQuery(new User(), department, course, List.of(classroom));
        when(weeklyScheduleRepository.findAllByClassroom_IdAndDayOfWeekAndTimeSlot(classroom.getId(), "MONDAY", "09:10-09:55"))
                .thenReturn(List.of(conflict));

        List<AvailableClassroomResponse> response = weeklyScheduleService.getAvailableClassrooms(new User(), course.getId(), "MONDAY", "08:15-09:00", 3, null);

        assertThat(response).singleElement().satisfies(item -> {
            assertThat(item.capacitySufficient()).isTrue();
            assertThat(item.selectable()).isFalse();
            assertThat(item.conflictCode()).isEqualTo("CLASSROOM_CONFLICT");
        });
    }

    @Test
    void availableClassroomsRejectsForeignExcludedScheduleId() {
        Department department = department(UUID.randomUUID(), faculty(UUID.randomUUID()));
        Department otherDepartment = department(UUID.randomUUID(), department.getFaculty());
        Course course = course(UUID.randomUUID(), department);
        Course otherCourse = course(UUID.randomUUID(), otherDepartment);
        Classroom classroom = classroom(UUID.randomUUID(), department.getFaculty(), "A101", 75);
        WeeklySchedule foreignSchedule = schedule(otherCourse, classroom, "MONDAY", "10:05-10:50");

        when(accessScopeService.requireDepartmentScope(any(User.class))).thenReturn(department);
        when(courseRepository.findById(course.getId())).thenReturn(Optional.of(course));
        when(departmentScheduleConfigRepository.findByDepartmentId(department.getId())).thenReturn(Optional.empty());
        when(weeklyScheduleRepository.findWithDetailsById(foreignSchedule.getId())).thenReturn(Optional.of(foreignSchedule));

        assertThatThrownBy(() -> weeklyScheduleService.getAvailableClassrooms(new User(), course.getId(), "MONDAY", "10:05-10:50", 1, foreignSchedule.getId()))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void createScheduleAllowsInsufficientCapacityAlternativeWhenOtherRulesPass() {
        User currentUser = new User();
        Department department = department(UUID.randomUUID(), faculty(UUID.randomUUID()));
        Course course = course(UUID.randomUUID(), department);
        course.setStudentCount(50);
        Classroom classroom = classroom(UUID.randomUUID(), department.getFaculty(), "D040", 40);
        CreateWeeklyScheduleRequest request = new CreateWeeklyScheduleRequest(course.getId(), classroom.getId(), "MONDAY", "10:05-10:50", 1);

        when(accessScopeService.requireDepartmentScope(currentUser)).thenReturn(department);
        when(courseRepository.findById(course.getId())).thenReturn(Optional.of(course));
        when(classroomRepository.findById(classroom.getId())).thenReturn(Optional.of(classroom));
        when(departmentScheduleConfigRepository.findByDepartmentId(department.getId())).thenReturn(Optional.empty());
        when(weeklyScheduleRepository.findAllByCourse_Department_IdAndCourse_SemesterOrderByDayOfWeekAscTimeSlotAsc(department.getId(), Semester.GUZ))
                .thenReturn(List.of());
        when(weeklyScheduleRepository.findAllByClassroom_IdAndDayOfWeekAndTimeSlot(classroom.getId(), "MONDAY", "10:05-10:50"))
                .thenReturn(List.of());
        when(weeklyScheduleRepository.findAllByCourse_Academician_IdAndDayOfWeekAndTimeSlot(course.getAcademician().getId(), "MONDAY", "10:05-10:50"))
                .thenReturn(List.of());
        when(weeklyScheduleRepository.findAllByCourse_Department_IdAndCourse_GradeAndDayOfWeekAndTimeSlot(department.getId(), course.getGrade(), "MONDAY", "10:05-10:50"))
                .thenReturn(List.of());
        when(weeklyScheduleRepository.saveAll(anyList())).thenAnswer(invocation -> invocation.getArgument(0));

        assertThat(weeklyScheduleService.createSchedule(request, currentUser)).hasSize(1);
    }

    @Test
    void createScheduleRejectsClassroomOutsideFacultyScope() {
        User currentUser = new User();
        Department department = department(UUID.randomUUID(), faculty(UUID.randomUUID()));
        Course course = course(UUID.randomUUID(), department);
        Classroom foreignClassroom = classroom(UUID.randomUUID(), faculty(UUID.randomUUID()), "X101", 100);
        CreateWeeklyScheduleRequest request = new CreateWeeklyScheduleRequest(course.getId(), foreignClassroom.getId(), "MONDAY", "10:05-10:50", 1);

        when(accessScopeService.requireDepartmentScope(currentUser)).thenReturn(department);
        when(courseRepository.findById(course.getId())).thenReturn(Optional.of(course));
        when(classroomRepository.findById(foreignClassroom.getId())).thenReturn(Optional.of(foreignClassroom));

        assertThatThrownBy(() -> weeklyScheduleService.createSchedule(request, currentUser))
                .isInstanceOf(AccessDeniedException.class);
        verify(weeklyScheduleRepository, never()).saveAll(any());
    }

    @Test
    void getScheduleCompletionReturnsAllCourseStatusesForSelectedSemester() {
        User currentUser = new User();
        Faculty faculty = faculty(UUID.randomUUID());
        Department department = department(UUID.randomUUID(), faculty);
        Course complete = course(UUID.randomUUID(), department, "CENG101", 3);
        Course incomplete = course(UUID.randomUUID(), department, "CENG201", 3);
        Course notScheduled = course(UUID.randomUUID(), department, "CENG301", 3);
        Course overScheduled = course(UUID.randomUUID(), department, "CENG401", 3);
        Classroom classroom = classroom(UUID.randomUUID(), faculty);

        List<Course> courses = List.of(complete, incomplete, notScheduled, overScheduled);
        List<WeeklySchedule> schedules = List.of(
                schedule(complete, classroom, "MONDAY", "09:00-10:00"),
                schedule(complete, classroom, "TUESDAY", "09:00-10:00"),
                schedule(complete, classroom, "WEDNESDAY", "09:00-10:00"),
                schedule(incomplete, classroom, "MONDAY", "10:00-11:00"),
                schedule(incomplete, classroom, "TUESDAY", "10:00-11:00"),
                schedule(overScheduled, classroom, "MONDAY", "11:00-12:00"),
                schedule(overScheduled, classroom, "TUESDAY", "11:00-12:00"),
                schedule(overScheduled, classroom, "WEDNESDAY", "11:00-12:00"),
                schedule(overScheduled, classroom, "THURSDAY", "11:00-12:00")
        );

        when(accessScopeService.requireDepartmentScope(currentUser)).thenReturn(department);
        when(courseRepository.findAllByDepartmentIdAndSemester(department.getId(), Semester.GUZ)).thenReturn(courses);
        when(weeklyScheduleRepository.findAllByCourse_Department_IdAndCourse_SemesterOrderByDayOfWeekAscTimeSlotAsc(department.getId(), Semester.GUZ))
                .thenReturn(schedules);

        ScheduleCompletionResponse response = weeklyScheduleService.getScheduleCompletion(currentUser, Semester.GUZ);

        assertThat(response.totalCourses()).isEqualTo(4);
        assertThat(response.completedCourses()).isEqualTo(1);
        assertThat(response.incompleteCourses()).isEqualTo(1);
        assertThat(response.notScheduledCourses()).isEqualTo(1);
        assertThat(response.overScheduledCourses()).isEqualTo(1);
        assertThat(response.completionPercentage()).isEqualTo(25);
        assertThat(response.courses()).anySatisfy(item -> {
            assertThat(item.courseId()).isEqualTo(complete.getId());
            assertThat(item.requiredHours()).isEqualTo(3);
            assertThat(item.scheduledHours()).isEqualTo(3);
            assertThat(item.remainingHours()).isZero();
            assertThat(item.status()).isEqualTo("COMPLETE");
        });
        assertThat(response.courses()).anySatisfy(item -> {
            assertThat(item.courseId()).isEqualTo(incomplete.getId());
            assertThat(item.scheduledHours()).isEqualTo(2);
            assertThat(item.remainingHours()).isEqualTo(1);
            assertThat(item.status()).isEqualTo("INCOMPLETE");
        });
        assertThat(response.courses()).anySatisfy(item -> {
            assertThat(item.courseId()).isEqualTo(notScheduled.getId());
            assertThat(item.scheduledHours()).isZero();
            assertThat(item.remainingHours()).isEqualTo(3);
            assertThat(item.status()).isEqualTo("NOT_SCHEDULED");
        });
        assertThat(response.courses()).anySatisfy(item -> {
            assertThat(item.courseId()).isEqualTo(overScheduled.getId());
            assertThat(item.scheduledHours()).isEqualTo(4);
            assertThat(item.remainingHours()).isEqualTo(-1);
            assertThat(item.status()).isEqualTo("OVER_SCHEDULED");
        });
    }

    private void mockAvailableClassroomQuery(User currentUser, Department department, Course course, List<Classroom> classrooms) {
        when(accessScopeService.requireDepartmentScope(any(User.class))).thenReturn(department);
        when(courseRepository.findById(course.getId())).thenReturn(Optional.of(course));
        when(departmentScheduleConfigRepository.findByDepartmentId(department.getId())).thenReturn(Optional.empty());
        when(classroomRepository.findAllByFloorBuildingFacultyIdOrderByCodeAsc(department.getFaculty().getId())).thenReturn(classrooms);
        when(weeklyScheduleRepository.findAllByClassroom_IdAndDayOfWeekAndTimeSlot(any(), any(), any())).thenReturn(List.of());
        when(weeklyScheduleRepository.findAllByCourse_Academician_IdAndDayOfWeekAndTimeSlot(any(), any(), any())).thenReturn(List.of());
        when(weeklyScheduleRepository.findAllByCourse_Department_IdAndCourse_GradeAndDayOfWeekAndTimeSlot(any(), any(), any(), any())).thenReturn(List.of());
    }

    private static Faculty faculty(UUID id) {
        Faculty faculty = new Faculty();
        faculty.setId(id);
        faculty.setName("Muhendislik Fakultesi");
        faculty.setCode("MF");
        return faculty;
    }

    private static Department department(UUID id, Faculty faculty) {
        Department department = new Department();
        department.setId(id);
        department.setName("Bilgisayar Muhendisligi");
        department.setCode("CENG");
        department.setFaculty(faculty);
        return department;
    }

    private static Course course(UUID id, Department department) {
        return course(id, department, department.getId().toString().substring(0, 4).toUpperCase(), 2);
    }

    private static Course course(UUID id, Department department, String code, int weeklyHours) {
        Academician academician = new Academician();
        academician.setId(UUID.randomUUID());
        academician.setTitle("Dr.");
        academician.setFirstName("Ada");
        academician.setLastName("Lovelace");
        academician.setDepartment(department);

        Course course = new Course();
        course.setId(id);
        course.setCode(code);
        course.setName("Programlamaya Giris");
        course.setDepartment(department);
        course.setFaculty(department.getFaculty());
        course.setAcademician(academician);
        course.setCourseType(CourseType.ZORUNLU);
        course.setSemester(Semester.GUZ);
        course.setTheoreticalHours(weeklyHours);
        course.setPracticalHours(0);
        course.setActive(true);
        return course;
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

    private static Classroom classroom(UUID id, Faculty faculty) {
        return classroom(id, faculty, "D101", 60);
    }

    private static Classroom classroom(UUID id, Faculty faculty, String code, int capacity) {
        Building building = new Building();
        building.setId(UUID.randomUUID());
        building.setFaculty(faculty);

        Floor floor = new Floor();
        floor.setId(UUID.randomUUID());
        floor.setBuilding(building);

        Classroom classroom = new Classroom();
        classroom.setId(id);
        classroom.setCode(code);
        classroom.setName(code);
        classroom.setCapacity(capacity);
        classroom.setType(ClassroomType.CLASSROOM);
        classroom.setFloor(floor);
        return classroom;
    }
}
