package com.dts.dersliktakip.service;

import com.dts.dersliktakip.dto.CreateWeeklyScheduleRequest;
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
import com.dts.dersliktakip.repository.WeeklyScheduleRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.util.Optional;
import java.util.UUID;

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
    private AccessScopeService accessScopeService;

    @InjectMocks
    private WeeklyScheduleService weeklyScheduleService;

    @Test
    void createScheduleRejectsCourseOutsideAuthenticatedDepartment() {
        User currentUser = new User();
        Department scopedDepartment = department(UUID.randomUUID(), faculty(UUID.randomUUID()));
        Department otherDepartment = department(UUID.randomUUID(), scopedDepartment.getFaculty());
        Course foreignCourse = course(UUID.randomUUID(), otherDepartment);
        CreateWeeklyScheduleRequest request = new CreateWeeklyScheduleRequest(foreignCourse.getId(), UUID.randomUUID(), "MONDAY", "10:00-11:00");

        when(accessScopeService.requireDepartmentScope(currentUser)).thenReturn(scopedDepartment);
        when(courseRepository.findById(foreignCourse.getId())).thenReturn(Optional.of(foreignCourse));

        assertThatThrownBy(() -> weeklyScheduleService.createSchedule(request, currentUser))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage("Bu ders için program oluşturma yetkiniz yok.");
        verify(classroomRepository, never()).findById(request.classroomId());
        verify(weeklyScheduleRepository, never()).save(org.mockito.ArgumentMatchers.any());
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
        conflict.setTimeSlot("10:00-11:00");
        CreateWeeklyScheduleRequest request = new CreateWeeklyScheduleRequest(course.getId(), classroom.getId(), "MONDAY", "10:00-11:00");

        when(accessScopeService.requireDepartmentScope(currentUser)).thenReturn(scopedDepartment);
        when(courseRepository.findById(course.getId())).thenReturn(Optional.of(course));
        when(classroomRepository.findById(classroom.getId())).thenReturn(Optional.of(classroom));
        when(weeklyScheduleRepository.findFirstByClassroom_IdAndDayOfWeekAndTimeSlot(classroom.getId(), "MONDAY", "10:00-11:00"))
                .thenReturn(Optional.of(conflict));

        assertThatThrownBy(() -> weeklyScheduleService.createSchedule(request, currentUser))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("D101 sınıfı Pazartesi 10:00-11:00 zamanında kullanımdadır.")
                .hasMessageContaining(conflictingCourse.getCode());
        verify(weeklyScheduleRepository, never()).save(org.mockito.ArgumentMatchers.any());
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
        Academician academician = new Academician();
        academician.setId(UUID.randomUUID());
        academician.setTitle("Dr.");
        academician.setFirstName("Ada");
        academician.setLastName("Lovelace");
        academician.setDepartment(department);

        Course course = new Course();
        course.setId(id);
        course.setCode(department.getId().toString().substring(0, 4).toUpperCase());
        course.setName("Programlamaya Giris");
        course.setDepartment(department);
        course.setFaculty(department.getFaculty());
        course.setAcademician(academician);
        course.setCourseType(CourseType.ZORUNLU);
        course.setSemester(Semester.GUZ);
        return course;
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
