package com.dts.dersliktakip.integration;

import com.dts.dersliktakip.entity.AcademicPeriod;
import com.dts.dersliktakip.entity.Academician;
import com.dts.dersliktakip.entity.Course;
import com.dts.dersliktakip.entity.CourseType;
import com.dts.dersliktakip.entity.Role;
import com.dts.dersliktakip.entity.Semester;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class CourseScheduleControllerIT extends IntegrationTestSupport {

    @Test
    void departmentAdminCreatesCourseThroughControllerServiceRepositoryDatabase() throws Exception {
        // REQ-3.5.2 -> TS-010 -> TC-010-01 -> TD-VALID-010
        CampusData campus = campus("CS01");
        AcademicPeriod period = activePeriod("CS01");
        Academician academician = academician("CS01", campus.faculty(), campus.department());
        user("dept-course-it@dts.test", Role.DEPARTMENT_ADMIN, campus.faculty().getName(), campus.department().getName());
        String token = loginToken("dept-course-it@dts.test");

        mockMvc.perform(post("/api/courses")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload(
                                "code", "s136101",
                                "name", "Sprint 13.6 Integration",
                                "academicianId", academician.getId(),
                                "theoreticalHours", 2,
                                "practicalHours", 0,
                                "ects", 4,
                                "credits", 3,
                                "studentCount", 40,
                                "courseType", CourseType.ZORUNLU,
                                "semester", Semester.GUZ,
                                "academicPeriodId", period.getId(),
                                "grade", 1,
                                "active", true
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code").value("S136101"))
                .andExpect(jsonPath("$.departmentId").value(campus.department().getId().toString()));

        assertThat(courseRepository.existsByCodeIgnoreCase("S136101")).isTrue();
    }

    @Test
    void scheduleCreationPersistsClassroomAndCourseRelationship() throws Exception {
        // REQ-3.5.3, REQ-3.5.4 -> TS-011 -> TC-011-01 -> TD-VALID-010, TD-VALID-011
        CampusData campus = campus("SC01");
        AcademicPeriod period = activePeriod("SC01");
        Academician academician = academician("SC01", campus.faculty(), campus.department());
        Course course = course("SC101", campus.faculty(), campus.department(), academician, period);
        user("dept-schedule-it@dts.test", Role.DEPARTMENT_ADMIN, campus.faculty().getName(), campus.department().getName());
        String token = loginToken("dept-schedule-it@dts.test");

        mockMvc.perform(post("/api/schedules")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload(
                                "courseId", course.getId(),
                                "classroomId", campus.classroom().getId(),
                                "dayOfWeek", "MONDAY",
                                "timeSlot", "08:15-09:00",
                                "slotCount", 1
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$[0].courseId").value(course.getId().toString()))
                .andExpect(jsonPath("$[0].classroomId").value(campus.classroom().getId().toString()));

        assertThat(weeklyScheduleRepository.findAllByClassroom_IdAndDayOfWeekAndTimeSlot(
                campus.classroom().getId(), "MONDAY", "08:15-09:00")).hasSize(1);
    }

    @Test
    void scheduleCreationRejectsClassroomConflictAndDoesNotPersistSecondSchedule() throws Exception {
        // BR-01 -> TS-012 -> TC-012-01 -> TD-COMBO-001
        CampusData campus = campus("CF01");
        AcademicPeriod period = activePeriod("CF01");
        Academician firstAcademician = academician("CF01A", campus.faculty(), campus.department());
        Academician secondAcademician = academician("CF01B", campus.faculty(), campus.department());
        Course firstCourse = course("CF101", campus.faculty(), campus.department(), firstAcademician, period);
        Course secondCourse = course("CF102", campus.faculty(), campus.department(), secondAcademician, period);
        secondCourse.setGrade(2);
        courseRepository.save(secondCourse);
        schedule(firstCourse, campus.classroom(), "TUESDAY", "08:15-09:00");
        user("dept-conflict-it@dts.test", Role.DEPARTMENT_ADMIN, campus.faculty().getName(), campus.department().getName());
        String token = loginToken("dept-conflict-it@dts.test");

        mockMvc.perform(post("/api/schedules")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload(
                                "courseId", secondCourse.getId(),
                                "classroomId", campus.classroom().getId(),
                                "dayOfWeek", "TUESDAY",
                                "timeSlot", "08:15-09:00",
                                "slotCount", 1
                        ))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("CLASSROOM_CONFLICT"));

        assertThat(weeklyScheduleRepository.findAllByClassroom_IdAndDayOfWeekAndTimeSlot(
                campus.classroom().getId(), "TUESDAY", "08:15-09:00")).hasSize(1);
    }

    @Test
    void departmentAdminCannotScheduleCourseWithOutOfFacultyClassroom() throws Exception {
        // AUTH-03, BR-07 -> TS-024 -> TC-024-02 -> TD-INVALID-010
        CampusData ownCampus = campus("ISO1");
        CampusData otherCampus = campus("ISO2");
        AcademicPeriod period = activePeriod("ISO1");
        Academician academician = academician("ISO1", ownCampus.faculty(), ownCampus.department());
        Course course = course("ISO101", ownCampus.faculty(), ownCampus.department(), academician, period);
        user("dept-isolation-it@dts.test", Role.DEPARTMENT_ADMIN, ownCampus.faculty().getName(), ownCampus.department().getName());
        String token = loginToken("dept-isolation-it@dts.test");

        mockMvc.perform(post("/api/schedules")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload(
                                "courseId", course.getId(),
                                "classroomId", otherCampus.classroom().getId(),
                                "dayOfWeek", "WEDNESDAY",
                                "timeSlot", "08:15-09:00",
                                "slotCount", 1
                        ))))
                .andExpect(status().isForbidden());

        assertThat(weeklyScheduleRepository.findAllByCourse_Department_IdAndCourse_AcademicPeriod_IdOrderByDayOfWeekAscTimeSlotAsc(
                ownCampus.department().getId(), period.getId())).isEmpty();
    }

    @Test
    void academicianCanReadOwnCourseButCannotCreateCourse() throws Exception {
        // REQ-3.5.2, AUTH-02 -> TS-010, TS-023 -> TC-010-02, TC-023-02 -> TD-VALID-003
        CampusData campus = campus("AC01");
        AcademicPeriod period = activePeriod("AC01");
        Academician academician = academician("AC01", campus.faculty(), campus.department());
        Course course = course("AC101", campus.faculty(), campus.department(), academician, period);
        user(academician.getEmail(), Role.ACADEMICIAN, campus.faculty().getName(), campus.department().getName());
        String token = loginToken(academician.getEmail());

        mockMvc.perform(get("/api/courses")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.courses[0].id").value(course.getId().toString()));

        mockMvc.perform(post("/api/courses")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload(
                                "code", "AC102",
                                "name", "Forbidden Course",
                                "academicianId", academician.getId(),
                                "theoreticalHours", 1,
                                "practicalHours", 0,
                                "ects", 3,
                                "credits", 2,
                                "studentCount", 20,
                                "courseType", CourseType.SECMELI,
                                "semester", Semester.GUZ,
                                "academicPeriodId", period.getId(),
                                "grade", 1,
                                "active", true
                        ))))
                .andExpect(status().isForbidden());
    }

    @Test
    void invalidScheduleRequestIsRejectedAtHttpValidationLayer() throws Exception {
        // REQ-3.5.4 -> TS-011 -> TC-011-06 -> TD-BOUNDARY-009
        CampusData campus = campus("VL01");
        user("dept-validation-it@dts.test", Role.DEPARTMENT_ADMIN, campus.faculty().getName(), campus.department().getName());
        String token = loginToken("dept-validation-it@dts.test");

        mockMvc.perform(post("/api/schedules")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload(
                                "classroomId", campus.classroom().getId(),
                                "dayOfWeek", "MONDAY",
                                "timeSlot", "08:15-09:00"
                        ))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Validation failed"));
    }
}
