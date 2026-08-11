package com.dts.dersliktakip.service;

import com.dts.dersliktakip.dto.AvailableClassroomResponse;
import com.dts.dersliktakip.dto.CourseScheduleStatusItemResponse;
import com.dts.dersliktakip.dto.CreateWeeklyScheduleRequest;
import com.dts.dersliktakip.dto.ScheduleCompletionResponse;
import com.dts.dersliktakip.dto.UpdateWeeklyScheduleRequest;
import com.dts.dersliktakip.dto.WeeklyScheduleResponse;
import com.dts.dersliktakip.entity.Academician;
import com.dts.dersliktakip.entity.Classroom;
import com.dts.dersliktakip.entity.Course;
import com.dts.dersliktakip.entity.Department;
import com.dts.dersliktakip.entity.Semester;
import com.dts.dersliktakip.entity.User;
import com.dts.dersliktakip.entity.WeeklySchedule;
import com.dts.dersliktakip.repository.ClassroomRepository;
import com.dts.dersliktakip.repository.CourseRepository;
import com.dts.dersliktakip.repository.WeeklyScheduleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WeeklyScheduleService {

    private static final Set<String> DAYS = Set.of("MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY");
    private static final Map<String, String> DAY_LABELS = Map.of(
            "MONDAY", "Pazartesi",
            "TUESDAY", "Salı",
            "WEDNESDAY", "Çarşamba",
            "THURSDAY", "Perşembe",
            "FRIDAY", "Cuma"
    );
    private static final Set<String> TIME_SLOTS = Set.of(
            "08:00-09:00",
            "09:00-10:00",
            "10:00-11:00",
            "11:00-12:00",
            "13:00-14:00",
            "14:00-15:00",
            "15:00-16:00",
            "16:00-17:00"
    );

    private final WeeklyScheduleRepository weeklyScheduleRepository;
    private final CourseRepository courseRepository;
    private final ClassroomRepository classroomRepository;
    private final AccessScopeService accessScopeService;

    @Transactional(readOnly = true)
    public List<WeeklyScheduleResponse> getSchedules(User currentUser, Semester semester) {
        Department department = accessScopeService.requireDepartmentScope(currentUser);
        List<WeeklySchedule> schedules = semester == null
                ? weeklyScheduleRepository.findAllByCourse_Department_IdOrderByDayOfWeekAscTimeSlotAsc(department.getId())
                : weeklyScheduleRepository.findAllByCourse_Department_IdAndCourse_SemesterOrderByDayOfWeekAscTimeSlotAsc(department.getId(), semester);
        return schedules.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public ScheduleCompletionResponse getScheduleCompletion(User currentUser, Semester semester) {
        Department department = accessScopeService.requireDepartmentScope(currentUser);
        List<Course> courses = semester == null
                ? courseRepository.findAllByDepartmentId(department.getId())
                : courseRepository.findAllByDepartmentIdAndSemester(department.getId(), semester);
        List<WeeklySchedule> schedules = semester == null
                ? weeklyScheduleRepository.findAllByCourse_Department_IdOrderByDayOfWeekAscTimeSlotAsc(department.getId())
                : weeklyScheduleRepository.findAllByCourse_Department_IdAndCourse_SemesterOrderByDayOfWeekAscTimeSlotAsc(department.getId(), semester);

        Map<UUID, Integer> scheduledHoursByCourseId = schedules.stream()
                .collect(Collectors.groupingBy(
                        schedule -> schedule.getCourse().getId(),
                        Collectors.collectingAndThen(
                                Collectors.toMap(
                                        schedule -> schedule.getCourse().getId() + ":" + schedule.getDayOfWeek() + ":" + schedule.getTimeSlot() + ":" + schedule.getClassroom().getId(),
                                        schedule -> durationHours(schedule.getTimeSlot()),
                                        Integer::max
                                ),
                                values -> values.values().stream().mapToInt(Integer::intValue).sum()
                        )
                ));

        List<CourseScheduleStatusItemResponse> items = courses.stream()
                .map(course -> toStatusItem(course, scheduledHoursByCourseId.getOrDefault(course.getId(), 0)))
                .toList();

        Map<String, Long> counts = items.stream()
                .collect(Collectors.groupingBy(CourseScheduleStatusItemResponse::status, Collectors.counting()));
        int totalCourses = items.size();
        int completedCourses = counts.getOrDefault("COMPLETE", 0L).intValue();
        int completionPercentage = totalCourses == 0 ? 100 : Math.round((completedCourses * 100f) / totalCourses);

        return new ScheduleCompletionResponse(
                department.getId(),
                department.getName(),
                semester,
                totalCourses,
                completedCourses,
                counts.getOrDefault("INCOMPLETE", 0L).intValue(),
                counts.getOrDefault("NOT_SCHEDULED", 0L).intValue(),
                counts.getOrDefault("OVER_SCHEDULED", 0L).intValue(),
                completionPercentage,
                items
        );
    }

    @Transactional(readOnly = true)
    public List<AvailableClassroomResponse> getAvailableClassrooms(User currentUser, String dayOfWeek, String timeSlot, UUID excludeScheduleId) {
        Department department = accessScopeService.requireDepartmentScope(currentUser);
        String normalizedDay = normalizeDay(dayOfWeek);
        String normalizedTimeSlot = normalizeTimeSlot(timeSlot);

        return classroomRepository.findAllByFloorBuildingFacultyIdOrderByCodeAsc(department.getFaculty().getId()).stream()
                .map(classroom -> toAvailableClassroomResponse(classroom, normalizedDay, normalizedTimeSlot, excludeScheduleId))
                .toList();
    }

    @Transactional
    public WeeklyScheduleResponse createSchedule(CreateWeeklyScheduleRequest request, User currentUser) {
        Department department = accessScopeService.requireDepartmentScope(currentUser);
        Course course = resolveCourse(request.courseId(), department);
        Classroom classroom = resolveClassroom(request.classroomId(), department);
        String dayOfWeek = normalizeDay(request.dayOfWeek());
        String timeSlot = normalizeTimeSlot(request.timeSlot());

        assertNoConflict(classroom, dayOfWeek, timeSlot, null);

        WeeklySchedule schedule = new WeeklySchedule();
        schedule.setCourse(course);
        schedule.setClassroom(classroom);
        schedule.setDayOfWeek(dayOfWeek);
        schedule.setTimeSlot(timeSlot);

        try {
            return toResponse(weeklyScheduleRepository.save(schedule));
        } catch (DataIntegrityViolationException exception) {
            throw new IllegalArgumentException(conflictMessage(classroom, dayOfWeek, timeSlot));
        }
    }

    @Transactional
    public WeeklyScheduleResponse updateSchedule(UUID id, UpdateWeeklyScheduleRequest request, User currentUser) {
        Department department = accessScopeService.requireDepartmentScope(currentUser);
        WeeklySchedule schedule = weeklyScheduleRepository.findWithDetailsById(id)
                .orElseThrow(() -> new IllegalArgumentException("Ders programı bulunamadı"));
        assertScheduleAccess(schedule, department);

        Course course = resolveCourse(request.courseId(), department);
        Classroom classroom = resolveClassroom(request.classroomId(), department);
        String dayOfWeek = normalizeDay(request.dayOfWeek());
        String timeSlot = normalizeTimeSlot(request.timeSlot());

        assertNoConflict(classroom, dayOfWeek, timeSlot, id);

        schedule.setCourse(course);
        schedule.setClassroom(classroom);
        schedule.setDayOfWeek(dayOfWeek);
        schedule.setTimeSlot(timeSlot);

        try {
            return toResponse(weeklyScheduleRepository.save(schedule));
        } catch (DataIntegrityViolationException exception) {
            throw new IllegalArgumentException(conflictMessage(classroom, dayOfWeek, timeSlot));
        }
    }

    @Transactional
    public void deleteSchedule(UUID id, User currentUser) {
        Department department = accessScopeService.requireDepartmentScope(currentUser);
        WeeklySchedule schedule = weeklyScheduleRepository.findWithDetailsById(id)
                .orElseThrow(() -> new IllegalArgumentException("Ders programı bulunamadı"));
        assertScheduleAccess(schedule, department);
        weeklyScheduleRepository.delete(schedule);
    }

    public List<String> getDays() {
        return List.copyOf(DAYS);
    }

    public List<String> getTimeSlots() {
        return List.copyOf(TIME_SLOTS);
    }

    private Course resolveCourse(UUID courseId, Department department) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new IllegalArgumentException("Ders bulunamadı"));
        if (course.getDepartment() == null || !course.getDepartment().getId().equals(department.getId())) {
            throw new AccessDeniedException("Bu ders için program oluşturma yetkiniz yok.");
        }
        return course;
    }

    private Classroom resolveClassroom(UUID classroomId, Department department) {
        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new IllegalArgumentException("Sınıf bulunamadı"));
        if (classroom.getFloor() == null
                || classroom.getFloor().getBuilding() == null
                || classroom.getFloor().getBuilding().getFaculty() == null
                || !classroom.getFloor().getBuilding().getFaculty().getId().equals(department.getFaculty().getId())) {
            throw new AccessDeniedException("Bu sınıf için yetkiniz yok.");
        }
        return classroom;
    }

    private void assertScheduleAccess(WeeklySchedule schedule, Department department) {
        if (schedule.getCourse() == null
                || schedule.getCourse().getDepartment() == null
                || !schedule.getCourse().getDepartment().getId().equals(department.getId())) {
            throw new AccessDeniedException("Bu ders programı için yetkiniz yok.");
        }
    }

    private void assertNoConflict(Classroom classroom, String dayOfWeek, String timeSlot, UUID excludeScheduleId) {
        Optional<WeeklySchedule> conflict = excludeScheduleId == null
                ? weeklyScheduleRepository.findFirstByClassroom_IdAndDayOfWeekAndTimeSlot(classroom.getId(), dayOfWeek, timeSlot)
                : weeklyScheduleRepository.findFirstByClassroom_IdAndDayOfWeekAndTimeSlotAndIdNot(classroom.getId(), dayOfWeek, timeSlot, excludeScheduleId);

        if (conflict.isPresent()) {
            WeeklySchedule schedule = conflict.get();
            Course course = schedule.getCourse();
            Department department = course != null ? course.getDepartment() : null;
            String detail = course != null
                    ? " Çakışan ders: " + course.getCode() + " - " + course.getName()
                    : "";
            String departmentDetail = department != null ? " (" + department.getName() + ")" : "";
            throw new IllegalArgumentException(conflictMessage(classroom, dayOfWeek, timeSlot) + detail + departmentDetail);
        }
    }

    private AvailableClassroomResponse toAvailableClassroomResponse(Classroom classroom, String dayOfWeek, String timeSlot, UUID excludeScheduleId) {
        Optional<WeeklySchedule> conflict = excludeScheduleId == null
                ? weeklyScheduleRepository.findFirstByClassroom_IdAndDayOfWeekAndTimeSlot(classroom.getId(), dayOfWeek, timeSlot)
                : weeklyScheduleRepository.findFirstByClassroom_IdAndDayOfWeekAndTimeSlotAndIdNot(classroom.getId(), dayOfWeek, timeSlot, excludeScheduleId);
        return new AvailableClassroomResponse(
                classroom.getId(),
                classroom.getCode(),
                classroom.getName(),
                classroom.getCapacity(),
                classroom.getType(),
                conflict.isEmpty(),
                conflict.map(value -> "Bu sınıf seçilen zaman diliminde kullanımda.").orElse(null)
        );
    }

    private WeeklyScheduleResponse toResponse(WeeklySchedule schedule) {
        Course course = schedule.getCourse();
        Academician academician = course.getAcademician();
        Classroom classroom = schedule.getClassroom();
        Department department = course.getDepartment();

        return new WeeklyScheduleResponse(
                schedule.getId(),
                course.getId(),
                course.getCode(),
                course.getName(),
                academician.getId(),
                formatAcademicianName(academician),
                classroom.getId(),
                classroom.getCode(),
                classroom.getName(),
                classroom.getCapacity(),
                classroom.getType(),
                department.getId(),
                department.getName(),
                schedule.getDayOfWeek(),
                schedule.getTimeSlot(),
                course.getSemester()
        );
    }

    private CourseScheduleStatusItemResponse toStatusItem(Course course, int scheduledHours) {
        int requiredHours = course.getTheoreticalHours() + course.getPracticalHours();
        int remainingHours = requiredHours - scheduledHours;
        String status = resolveStatus(requiredHours, scheduledHours);
        return new CourseScheduleStatusItemResponse(
                course.getId(),
                course.getCode(),
                course.getName(),
                formatAcademicianName(course.getAcademician()),
                course.getGrade(),
                requiredHours,
                scheduledHours,
                remainingHours,
                status
        );
    }

    private String resolveStatus(int requiredHours, int scheduledHours) {
        if (scheduledHours == 0) {
            return "NOT_SCHEDULED";
        }
        if (scheduledHours < requiredHours) {
            return "INCOMPLETE";
        }
        if (scheduledHours > requiredHours) {
            return "OVER_SCHEDULED";
        }
        return "COMPLETE";
    }

    private int durationHours(String timeSlot) {
        String[] parts = timeSlot.split("-");
        if (parts.length != 2) {
            return 1;
        }
        try {
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("HH:mm");
            LocalTime start = LocalTime.parse(parts[0].trim(), formatter);
            LocalTime end = LocalTime.parse(parts[1].trim(), formatter);
            long minutes = java.time.Duration.between(start, end).toMinutes();
            return Math.max(1, (int) Math.ceil(minutes / 60.0));
        } catch (RuntimeException exception) {
            return 1;
        }
    }

    private String normalizeDay(String dayOfWeek) {
        String normalized = dayOfWeek.trim().toUpperCase();
        if (!DAYS.contains(normalized)) {
            throw new IllegalArgumentException("Geçersiz gün seçimi.");
        }
        return normalized;
    }

    private String normalizeTimeSlot(String timeSlot) {
        String normalized = timeSlot.trim();
        if (!TIME_SLOTS.contains(normalized)) {
            throw new IllegalArgumentException("Geçersiz zaman bloğu seçimi.");
        }
        return normalized;
    }

    private String conflictMessage(Classroom classroom, String dayOfWeek, String timeSlot) {
        return classroom.getCode() + " sınıfı " + DAY_LABELS.getOrDefault(dayOfWeek, dayOfWeek) + " " + timeSlot + " zamanında kullanımdadır.";
    }

    private String formatAcademicianName(Academician academician) {
        return (academician.getTitle() + " " + academician.getFirstName() + " " + academician.getLastName()).trim();
    }
}
