package com.dts.dersliktakip.repository;

import com.dts.dersliktakip.entity.Semester;
import com.dts.dersliktakip.entity.WeeklySchedule;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WeeklyScheduleRepository extends JpaRepository<WeeklySchedule, UUID> {

    @EntityGraph(attributePaths = {
            "course",
            "course.department",
            "course.academician",
            "classroom",
            "classroom.floor",
            "classroom.floor.building",
            "classroom.floor.building.faculty"
    })
    List<WeeklySchedule> findAllByCourse_Department_IdOrderByDayOfWeekAscTimeSlotAsc(UUID departmentId);

    @EntityGraph(attributePaths = {"classroom", "course", "course.academician", "course.department"})
    List<WeeklySchedule> findAllByCourse_Department_IdAndCourse_GradeOrderByDayOfWeekAscTimeSlotAsc(UUID departmentId, int grade);

    @EntityGraph(attributePaths = {
            "course",
            "course.department",
            "course.academician",
            "classroom",
            "classroom.floor",
            "classroom.floor.building",
            "classroom.floor.building.faculty"
    })
    List<WeeklySchedule> findAllByCourse_Department_IdAndCourse_SemesterOrderByDayOfWeekAscTimeSlotAsc(UUID departmentId, Semester semester);

    @EntityGraph(attributePaths = {
            "course",
            "course.department",
            "course.academician",
            "course.academicPeriod",
            "classroom",
            "classroom.floor",
            "classroom.floor.building",
            "classroom.floor.building.faculty"
    })
    List<WeeklySchedule> findAllByCourse_Department_IdAndCourse_AcademicPeriod_IdOrderByDayOfWeekAscTimeSlotAsc(UUID departmentId, UUID periodId);

    @EntityGraph(attributePaths = {"course", "course.department", "course.academician", "classroom"})
    Optional<WeeklySchedule> findWithDetailsById(UUID id);

    @EntityGraph(attributePaths = {"course", "course.department", "course.academician", "classroom"})
    List<WeeklySchedule> findAllByScheduleGroupId(UUID scheduleGroupId);

    @EntityGraph(attributePaths = {"course", "course.department", "classroom"})
    List<WeeklySchedule> findAllByClassroom_IdAndDayOfWeekAndTimeSlot(UUID classroomId, String dayOfWeek, String timeSlot);

    @EntityGraph(attributePaths = {"course", "course.department", "course.academician", "classroom"})
    List<WeeklySchedule> findAllByCourse_Academician_IdAndDayOfWeekAndTimeSlot(UUID academicianId, String dayOfWeek, String timeSlot);

    @EntityGraph(attributePaths = {"course", "course.department", "course.academician", "classroom"})
    List<WeeklySchedule> findAllByCourse_Department_IdAndCourse_GradeAndDayOfWeekAndTimeSlot(UUID departmentId, int grade, String dayOfWeek, String timeSlot);

    @EntityGraph(attributePaths = {"course", "course.department", "classroom"})
    Optional<WeeklySchedule> findFirstByClassroom_IdAndDayOfWeekAndTimeSlot(UUID classroomId, String dayOfWeek, String timeSlot);

    @EntityGraph(attributePaths = {"course", "course.department", "classroom"})
    Optional<WeeklySchedule> findFirstByClassroom_IdAndDayOfWeekAndTimeSlotAndIdNot(UUID classroomId, String dayOfWeek, String timeSlot, UUID id);

    @EntityGraph(attributePaths = {"course", "course.department", "classroom"})
    List<WeeklySchedule> findAllByClassroom_Floor_IdAndDayOfWeekOrderByTimeSlotAsc(UUID floorId, String dayOfWeek);

    @EntityGraph(attributePaths = {"course", "course.department", "course.academician", "classroom"})
    List<WeeklySchedule> findAllByClassroom_IdAndDayOfWeekOrderByTimeSlotAsc(UUID classroomId, String dayOfWeek);

    @EntityGraph(attributePaths = {"course", "course.department", "course.academician", "classroom"})
    List<WeeklySchedule> findAllByClassroom_IdOrderByDayOfWeekAscTimeSlotAsc(UUID classroomId);

    @EntityGraph(attributePaths = {"course", "course.department", "course.academician", "classroom"})
    Optional<WeeklySchedule> findFirstByCourse_Academician_IdAndDayOfWeekAndTimeSlot(UUID academicianId, String dayOfWeek, String timeSlot);

    @EntityGraph(attributePaths = {"course", "course.department", "course.academician", "classroom"})
    Optional<WeeklySchedule> findFirstByCourse_Academician_IdAndDayOfWeekAndTimeSlotAndIdNot(UUID academicianId, String dayOfWeek, String timeSlot, UUID id);

    @EntityGraph(attributePaths = {"course", "course.department", "course.academician", "classroom"})
    List<WeeklySchedule> findAllByCourse_Academician_IdOrderByDayOfWeekAscTimeSlotAsc(UUID academicianId);

    @EntityGraph(attributePaths = {"course", "course.department", "course.academician", "classroom"})
    List<WeeklySchedule> findAllByCourse_Academician_IdAndCourse_SemesterOrderByDayOfWeekAscTimeSlotAsc(UUID academicianId, Semester semester);

    @EntityGraph(attributePaths = {"course", "course.department", "course.academician", "course.academicPeriod", "classroom"})
    List<WeeklySchedule> findAllByCourse_Academician_IdAndCourse_AcademicPeriod_IdOrderByDayOfWeekAscTimeSlotAsc(UUID academicianId, UUID periodId);
}
