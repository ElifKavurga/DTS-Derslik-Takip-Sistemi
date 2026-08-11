package com.dts.dersliktakip.service;

import com.dts.dersliktakip.dto.CreateWeeklyScheduleRequest;
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
import com.dts.dersliktakip.repository.ClassroomRepository;
import com.dts.dersliktakip.repository.CourseRepository;
import com.dts.dersliktakip.repository.DepartmentScheduleConfigRepository;
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
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("D101 sınıfı Pazartesi 10:05-10:50 zamanında kullanımdadır.")
                .hasMessageContaining(conflictingCourse.getCode());
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
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Bu akademisyen seçilen zaman dilimlerinden birinde başka bir derste görevlidir: 10:05-10:50");
        verify(weeklyScheduleRepository, never()).saveAll(org.mockito.ArgumentMatchers.any());
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
        Building building = new Building();
        building.setId(UUID.randomUUID());
        building.setFaculty(faculty);

        Floor floor = new Floor();
        floor.setId(UUID.randomUUID());
        floor.setBuilding(building);

        Classroom classroom = new Classroom();
        classroom.setId(id);
        classroom.setCode("D101");
        classroom.setName("D-101");
        classroom.setCapacity(60);
        classroom.setType(ClassroomType.CLASSROOM);
        classroom.setFloor(floor);
        return classroom;
    }
}
