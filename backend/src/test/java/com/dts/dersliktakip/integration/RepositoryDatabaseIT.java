package com.dts.dersliktakip.integration;

import com.dts.dersliktakip.entity.AcademicPeriod;
import com.dts.dersliktakip.entity.Academician;
import com.dts.dersliktakip.entity.Classroom;
import com.dts.dersliktakip.entity.Course;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class RepositoryDatabaseIT extends IntegrationTestSupport {

    @Test
    void courseRepositoryPersistsAndRetrievesCourseAcademicianProgramRelations() {
        // REQ-3.5.1, REQ-3.5.2 -> TS-009, TS-010 -> TD-VALID-010
        CampusData campus = campus("RP01");
        AcademicPeriod period = activePeriod("RP01");
        Academician academician = academician("RP01", campus.faculty(), campus.department());
        Course course = course("RP101", campus.faculty(), campus.department(), academician, period);

        Course found = courseRepository.findAllByDepartmentIdAndAcademicPeriodId(
                        campus.department().getId(), period.getId())
                .get(0);

        assertThat(found.getId()).isEqualTo(course.getId());
        assertThat(found.getAcademician().getId()).isEqualTo(academician.getId());
        assertThat(found.getDepartment().getId()).isEqualTo(campus.department().getId());
        assertThat(found.getFaculty().getId()).isEqualTo(campus.faculty().getId());
        assertThat(found.getAcademicPeriod().getId()).isEqualTo(period.getId());
    }

    @Test
    void classroomRepositoryFiltersClassroomsByFacultyScopeThroughFloorAndBuilding() {
        // REQ-3.4.5, AUTH-03 -> TS-007, TS-024 -> TD-VALID-008, TD-INVALID-010
        CampusData ownCampus = campus("RP02A");
        CampusData otherCampus = campus("RP02B");
        Classroom ownSecondClassroom = classroom("D202RP02A", "Derslik 202 RP02A", 30, ownCampus.floor());

        assertThat(classroomRepository.findAllByFloorBuildingFacultyIdOrderByCodeAsc(ownCampus.faculty().getId()))
                .extracting(Classroom::getId)
                .contains(ownCampus.classroom().getId(), ownSecondClassroom.getId())
                .doesNotContain(otherCampus.classroom().getId());
    }

    @Test
    void weeklyScheduleRepositoryPersistsAndDeletesProgramClassroomRelation() {
        // REQ-3.5.3, REQ-3.5.4 -> TS-011 -> TD-VALID-011
        CampusData campus = campus("RP03");
        AcademicPeriod period = activePeriod("RP03");
        Academician academician = academician("RP03", campus.faculty(), campus.department());
        Course course = course("RP301", campus.faculty(), campus.department(), academician, period);

        var saved = schedule(course, campus.classroom(), "FRIDAY", "09:10-09:55");

        assertThat(weeklyScheduleRepository.findAllByClassroom_IdAndDayOfWeekAndTimeSlot(
                campus.classroom().getId(), "FRIDAY", "09:10-09:55"))
                .extracting(item -> item.getCourse().getId())
                .containsExactly(course.getId());

        weeklyScheduleRepository.delete(saved);
        weeklyScheduleRepository.flush();

        assertThat(weeklyScheduleRepository.findAllByClassroom_IdAndDayOfWeekAndTimeSlot(
                campus.classroom().getId(), "FRIDAY", "09:10-09:55")).isEmpty();
    }
}
