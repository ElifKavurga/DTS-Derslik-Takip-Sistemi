package com.dts.dersliktakip.repository;

import com.dts.dersliktakip.entity.ScheduleException;
import com.dts.dersliktakip.entity.ScheduleExceptionType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ScheduleExceptionRepository extends JpaRepository<ScheduleException, UUID> {

    @EntityGraph(attributePaths = {"course", "course.department", "course.academician", "academician", "classroom", "originalSchedule", "originalSchedule.classroom"})
    List<ScheduleException> findAllByAcademician_IdAndTargetDateBetweenOrderByTargetDateAscTimeSlotAsc(UUID academicianId, LocalDate start, LocalDate end);

    @EntityGraph(attributePaths = {"course", "course.department", "course.academician", "academician", "classroom", "originalSchedule", "originalSchedule.classroom"})
    List<ScheduleException> findAllByAcademician_IdOrderByTargetDateDescTimeSlotAsc(UUID academicianId);

    @EntityGraph(attributePaths = {"course", "course.department", "course.academician", "academician", "classroom", "originalSchedule", "originalSchedule.classroom"})
    List<ScheduleException> findAllByCourse_Department_IdOrderByTargetDateDescTimeSlotAsc(UUID departmentId);

    @EntityGraph(attributePaths = {"course", "course.department", "course.academician", "academician", "classroom", "originalSchedule", "originalSchedule.classroom"})
    List<ScheduleException> findAllByCourse_Department_IdAndTargetDateBetweenOrderByTargetDateAscTimeSlotAsc(UUID departmentId, LocalDate start, LocalDate end);

    boolean existsByOriginalSchedule_IdAndOriginalDateAndType(UUID originalScheduleId, LocalDate originalDate, ScheduleExceptionType type);

    boolean existsByOriginalSchedule_IdAndOriginalDateAndTypeIn(UUID originalScheduleId, LocalDate originalDate, List<ScheduleExceptionType> types);

    boolean existsByCourse_IdAndTargetDateAndTimeSlotAndType(UUID courseId, LocalDate targetDate, String timeSlot, ScheduleExceptionType type);

    @EntityGraph(attributePaths = {"course", "course.department", "course.academician", "academician", "classroom"})
    Optional<ScheduleException> findWithDetailsById(UUID id);

    @EntityGraph(attributePaths = {"course", "course.department", "course.academician", "academician", "classroom"})
    List<ScheduleException> findAllByTargetDateAndTimeSlot(LocalDate targetDate, String timeSlot);
}
