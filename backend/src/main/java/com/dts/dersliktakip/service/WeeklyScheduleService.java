package com.dts.dersliktakip.service;

import com.dts.dersliktakip.dto.AvailableClassroomResponse;
import com.dts.dersliktakip.dto.CourseScheduleStatusItemResponse;
import com.dts.dersliktakip.dto.CreateWeeklyScheduleRequest;
import com.dts.dersliktakip.dto.ScheduleCompletionResponse;
import com.dts.dersliktakip.dto.ScheduleTimeConfigurationRequest;
import com.dts.dersliktakip.dto.ScheduleTimeConfigurationResponse;
import com.dts.dersliktakip.dto.ScheduleTimeSlotResponse;
import com.dts.dersliktakip.dto.UpdateWeeklyScheduleRequest;
import com.dts.dersliktakip.dto.WeeklyScheduleResponse;
import com.dts.dersliktakip.entity.Academician;
import com.dts.dersliktakip.entity.Classroom;
import com.dts.dersliktakip.entity.Course;
import com.dts.dersliktakip.entity.CourseType;
import com.dts.dersliktakip.entity.Department;
import com.dts.dersliktakip.entity.DepartmentScheduleConfig;
import com.dts.dersliktakip.entity.Semester;
import com.dts.dersliktakip.entity.User;
import com.dts.dersliktakip.entity.WeeklySchedule;
import com.dts.dersliktakip.exception.ScheduleConflictException;
import com.dts.dersliktakip.repository.ClassroomRepository;
import com.dts.dersliktakip.repository.CourseRepository;
import com.dts.dersliktakip.repository.DepartmentScheduleConfigRepository;
import com.dts.dersliktakip.repository.AcademicianRepository;
import com.dts.dersliktakip.repository.WeeklyScheduleRepository;
import com.dts.dersliktakip.entity.Role;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WeeklyScheduleService {

    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");
    private static final Set<String> DAYS = Set.of("MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY");
    private static final String CLASSROOM_CONFLICT = "CLASSROOM_CONFLICT";
    private static final String ACADEMICIAN_CONFLICT = "ACADEMICIAN_CONFLICT";
    private static final String STUDENT_GROUP_CONFLICT = "STUDENT_GROUP_CONFLICT";
    private static final String CAPACITY_CONFLICT = "CAPACITY_CONFLICT";
    private static final String SCHEDULE_CONFLICT = "SCHEDULE_CONFLICT";
    private static final Map<String, String> DAY_LABELS = Map.of(
            "MONDAY", "Pazartesi",
            "TUESDAY", "Salı",
            "WEDNESDAY", "Çarşamba",
            "THURSDAY", "Perşembe",
            "FRIDAY", "Cuma"
    );

    private final WeeklyScheduleRepository weeklyScheduleRepository;
    private final CourseRepository courseRepository;
    private final ClassroomRepository classroomRepository;
    private final DepartmentScheduleConfigRepository departmentScheduleConfigRepository;
    private final AccessScopeService accessScopeService;
    private final AcademicianRepository academicianRepository;

    @Transactional(readOnly = true)
    public List<WeeklyScheduleResponse> getSchedules(User currentUser, Semester semester) {
        if (currentUser.getRoles() != null && currentUser.getRoles().contains(Role.ACADEMICIAN)) {
            Academician academician = academicianRepository.findByEmail(currentUser.getEmail())
                    .orElseThrow(() -> new AccessDeniedException("Akademisyen kaydı bulunamadı."));
            List<WeeklySchedule> schedules = semester == null
                    ? weeklyScheduleRepository.findAllByCourse_Academician_IdOrderByDayOfWeekAscTimeSlotAsc(academician.getId())
                    : weeklyScheduleRepository.findAllByCourse_Academician_IdAndCourse_SemesterOrderByDayOfWeekAscTimeSlotAsc(academician.getId(), semester);
            return schedules.stream().map(this::toResponse).toList();
        }

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
                                        schedule -> 1,
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
    public ScheduleTimeConfigurationResponse getTimeConfiguration(User currentUser) {
        Department department = resolveScheduleDepartment(currentUser);
        DepartmentScheduleConfig config = resolveConfig(department);
        return toTimeConfigurationResponse(department, config);
    }

    @Transactional
    public ScheduleTimeConfigurationResponse updateTimeConfiguration(User currentUser, ScheduleTimeConfigurationRequest request) {
        Department department = accessScopeService.requireDepartmentScope(currentUser);
        validateConfiguration(request);
        DepartmentScheduleConfig config = departmentScheduleConfigRepository.findByDepartmentId(department.getId())
                .orElseGet(() -> {
                    DepartmentScheduleConfig created = new DepartmentScheduleConfig();
                    created.setDepartment(department);
                    return created;
                });
        applyConfiguration(config, request);
        departmentScheduleConfigRepository.save(config);
        return toTimeConfigurationResponse(department, config);
    }

    @Transactional(readOnly = true)
    public List<AvailableClassroomResponse> getAvailableClassrooms(User currentUser, UUID courseId, String dayOfWeek, String timeSlot, Integer slotCount, UUID excludeScheduleId) {
        Department department = resolveScheduleDepartment(currentUser);
        String normalizedDay = normalizeDay(dayOfWeek);
        List<String> selectedSlots = resolveSelectedSlots(department, timeSlot, normalizeSlotCount(slotCount));
        Course course = courseId != null ? resolveCourse(courseId, department) : null;
        if (course != null && currentUser.getRoles() != null && currentUser.getRoles().contains(Role.ACADEMICIAN)) {
            Academician academician = academicianRepository.findByEmail(currentUser.getEmail())
                    .orElseThrow(() -> new AccessDeniedException("Akademisyen kaydı bulunamadı."));
            if (course.getAcademician() == null || !course.getAcademician().getId().equals(academician.getId())) {
                throw new AccessDeniedException("Bu ders için işlem yapma yetkiniz yok.");
            }
        }
        Set<UUID> excludedIds = resolveExcludedScheduleIds(excludeScheduleId, department);

        return classroomRepository.findAllByFloorBuildingFacultyIdOrderByCodeAsc(department.getFaculty().getId()).stream()
                .map(classroom -> toAvailableClassroomResponse(classroom, course, normalizedDay, selectedSlots, excludedIds))
                .sorted(availableClassroomComparator())
                .toList();
    }

    @Transactional
    public List<WeeklyScheduleResponse> createSchedule(CreateWeeklyScheduleRequest request, User currentUser) {
        Department department = accessScopeService.requireDepartmentScope(currentUser);
        Course course = resolveCourse(request.courseId(), department);
        Classroom classroom = resolveClassroom(request.classroomId(), department);
        String dayOfWeek = normalizeDay(request.dayOfWeek());
        List<String> selectedSlots = resolveSelectedSlots(department, request.timeSlot(), normalizeSlotCount(request.slotCount()));

        assertRemainingHoursSufficient(course, department, selectedSlots.size(), Set.of());
        assertScheduleSelectionAvailable(course, department, classroom, dayOfWeek, selectedSlots, Set.of());

        UUID groupId = UUID.randomUUID();
        List<WeeklySchedule> schedules = selectedSlots.stream()
                .map(slot -> newSchedule(course, classroom, dayOfWeek, slot, groupId))
                .toList();

        try {
            return weeklyScheduleRepository.saveAll(schedules).stream().map(this::toResponse).toList();
        } catch (DataIntegrityViolationException exception) {
            throw new ScheduleConflictException(CLASSROOM_CONFLICT, "Bu saate ders koyulamaz.", List.of(conflictMessage(classroom, dayOfWeek, selectedSlots.get(0))));
        }
    }

    @Transactional
    public List<WeeklyScheduleResponse> updateSchedule(UUID id, UpdateWeeklyScheduleRequest request, User currentUser) {
        Department department = accessScopeService.requireDepartmentScope(currentUser);
        WeeklySchedule schedule = weeklyScheduleRepository.findWithDetailsById(id)
                .orElseThrow(() -> new IllegalArgumentException("Ders programı bulunamadı"));
        assertScheduleAccess(schedule, department);

        Course course = resolveCourse(request.courseId(), department);
        Classroom classroom = resolveClassroom(request.classroomId(), department);
        String dayOfWeek = normalizeDay(request.dayOfWeek());
        List<String> selectedSlots = resolveSelectedSlots(department, request.timeSlot(), normalizeSlotCount(request.slotCount()));
        List<WeeklySchedule> existingGroup = resolveScheduleGroup(schedule);
        Set<UUID> excludedIds = existingGroup.stream().map(WeeklySchedule::getId).collect(Collectors.toSet());

        assertRemainingHoursSufficient(course, department, selectedSlots.size(), excludedIds);
        assertScheduleSelectionAvailable(course, department, classroom, dayOfWeek, selectedSlots, excludedIds);

        UUID groupId = Optional.ofNullable(schedule.getScheduleGroupId()).orElse(UUID.randomUUID());
        weeklyScheduleRepository.deleteAll(existingGroup);
        weeklyScheduleRepository.flush();
        List<WeeklySchedule> schedules = selectedSlots.stream()
                .map(slot -> newSchedule(course, classroom, dayOfWeek, slot, groupId))
                .toList();

        try {
            return weeklyScheduleRepository.saveAll(schedules).stream().map(this::toResponse).toList();
        } catch (DataIntegrityViolationException exception) {
            throw new ScheduleConflictException(CLASSROOM_CONFLICT, "Bu saate ders koyulamaz.", List.of(conflictMessage(classroom, dayOfWeek, selectedSlots.get(0))));
        }
    }

    @Transactional
    public void deleteSchedule(UUID id, User currentUser) {
        Department department = accessScopeService.requireDepartmentScope(currentUser);
        WeeklySchedule schedule = weeklyScheduleRepository.findWithDetailsById(id)
                .orElseThrow(() -> new IllegalArgumentException("Ders programı bulunamadı"));
        assertScheduleAccess(schedule, department);
        weeklyScheduleRepository.deleteAll(resolveScheduleGroup(schedule));
    }

    public List<String> getDays() {
        return List.copyOf(DAYS);
    }

    public List<String> getTimeSlots() {
        return generateSlots(defaultConfig(null)).stream().map(ScheduleTimeSlotResponse::value).toList();
    }

    private DepartmentScheduleConfig resolveConfig(Department department) {
        return departmentScheduleConfigRepository.findByDepartmentId(department.getId())
                .orElseGet(() -> defaultConfig(department));
    }

    private Department resolveScheduleDepartment(User currentUser) {
        if (currentUser.getRoles() != null && currentUser.getRoles().contains(Role.ACADEMICIAN)) {
            Academician academician = academicianRepository.findByEmail(currentUser.getEmail())
                    .orElseThrow(() -> new AccessDeniedException("Akademisyen kaydı bulunamadı."));
            return academician.getDepartment();
        }
        return accessScopeService.requireDepartmentScope(currentUser);
    }

    private DepartmentScheduleConfig defaultConfig(Department department) {
        DepartmentScheduleConfig config = new DepartmentScheduleConfig();
        config.setDepartment(department);
        config.setStartTime("08:15");
        config.setEndTime("17:00");
        config.setLessonDurationMinutes(45);
        config.setBreakDurationMinutes(10);
        config.setLunchBreakEnabled(true);
        config.setLunchBreakStart("12:40");
        config.setLunchBreakEnd("13:30");
        return config;
    }

    private void applyConfiguration(DepartmentScheduleConfig config, ScheduleTimeConfigurationRequest request) {
        config.setStartTime(normalizeTime(request.startTime()));
        config.setEndTime(normalizeTime(request.endTime()));
        config.setLessonDurationMinutes(request.lessonDurationMinutes());
        config.setBreakDurationMinutes(request.breakDurationMinutes());
        config.setLunchBreakEnabled(request.lunchBreakEnabled());
        config.setLunchBreakStart(normalizeTime(request.lunchBreakStart()));
        config.setLunchBreakEnd(normalizeTime(request.lunchBreakEnd()));
    }

    private void validateConfiguration(ScheduleTimeConfigurationRequest request) {
        LocalTime start = parseTime(request.startTime());
        LocalTime end = parseTime(request.endTime());
        if (!start.isBefore(end)) {
            throw new IllegalArgumentException("Program başlangıç saati bitiş saatinden önce olmalıdır.");
        }
        if (request.lunchBreakEnabled()) {
            LocalTime lunchStart = parseTime(request.lunchBreakStart());
            LocalTime lunchEnd = parseTime(request.lunchBreakEnd());
            if (!lunchStart.isBefore(lunchEnd) || lunchStart.isBefore(start) || lunchEnd.isAfter(end)) {
                throw new IllegalArgumentException("Öğle arası program saatleri içinde ve geçerli olmalıdır.");
            }
        } else {
            parseTime(request.lunchBreakStart());
            parseTime(request.lunchBreakEnd());
        }
        DepartmentScheduleConfig config = defaultConfig(null);
        applyConfiguration(config, request);
        generateSlots(config);
    }

    private ScheduleTimeConfigurationResponse toTimeConfigurationResponse(Department department, DepartmentScheduleConfig config) {
        List<ScheduleTimeSlotResponse> slots = generateSlots(config);
        Set<String> generatedSlotValues = slots.stream().map(ScheduleTimeSlotResponse::value).collect(Collectors.toSet());
        int affectedScheduleCount = weeklyScheduleRepository.findAllByCourse_Department_IdOrderByDayOfWeekAscTimeSlotAsc(department.getId()).stream()
                .filter(schedule -> !generatedSlotValues.contains(schedule.getTimeSlot()))
                .toList()
                .size();
        return new ScheduleTimeConfigurationResponse(
                department.getId(),
                department.getName(),
                config.getStartTime(),
                config.getEndTime(),
                config.getLessonDurationMinutes(),
                config.getBreakDurationMinutes(),
                Boolean.TRUE.equals(config.getLunchBreakEnabled()),
                config.getLunchBreakStart(),
                config.getLunchBreakEnd(),
                slots,
                affectedScheduleCount
        );
    }

    private List<ScheduleTimeSlotResponse> generateSlots(DepartmentScheduleConfig config) {
        LocalTime start = parseTime(config.getStartTime());
        LocalTime end = parseTime(config.getEndTime());
        LocalTime lunchStart = parseTime(config.getLunchBreakStart());
        LocalTime lunchEnd = parseTime(config.getLunchBreakEnd());
        int lessonMinutes = config.getLessonDurationMinutes();
        int breakMinutes = config.getBreakDurationMinutes();
        boolean lunchEnabled = Boolean.TRUE.equals(config.getLunchBreakEnabled());

        List<ScheduleTimeSlotResponse> slots = new ArrayList<>();
        LocalTime cursor = start;
        while (!cursor.plusMinutes(lessonMinutes).isAfter(end)) {
            LocalTime slotEnd = cursor.plusMinutes(lessonMinutes);
            if (lunchEnabled && overlaps(cursor, slotEnd, lunchStart, lunchEnd)) {
                cursor = lunchEnd;
                continue;
            }
            String slotStartText = cursor.format(TIME_FORMATTER);
            String slotEndText = slotEnd.format(TIME_FORMATTER);
            slots.add(new ScheduleTimeSlotResponse(slotStartText + "-" + slotEndText, slotStartText, slotEndText, slots.size()));
            cursor = slotEnd.plusMinutes(breakMinutes);
        }
        if (slots.isEmpty()) {
            throw new IllegalArgumentException("Seçilen saat ayarlarıyla ders bloğu oluşturulamıyor.");
        }
        return slots;
    }

    private boolean overlaps(LocalTime start, LocalTime end, LocalTime blockedStart, LocalTime blockedEnd) {
        return start.isBefore(blockedEnd) && end.isAfter(blockedStart);
    }

    private List<String> resolveSelectedSlots(Department department, String timeSlot, int slotCount) {
        List<String> slots = generateSlots(resolveConfig(department)).stream().map(ScheduleTimeSlotResponse::value).toList();
        String normalizedTimeSlot = normalizeTimeSlotFormat(timeSlot);
        int startIndex = slots.indexOf(normalizedTimeSlot);
        if (startIndex < 0) {
            throw new IllegalArgumentException("Geçersiz zaman bloğu seçimi.");
        }
        if (startIndex + slotCount > slots.size()) {
            throw new IllegalArgumentException("Seçilen ders saati program bitişini aşıyor.");
        }
        return slots.subList(startIndex, startIndex + slotCount);
    }

    private int normalizeSlotCount(Integer slotCount) {
        int normalized = slotCount == null ? 1 : slotCount;
        if (normalized < 1 || normalized > 12) {
            throw new IllegalArgumentException("Ders saati 1 ile 12 arasında olmalıdır.");
        }
        return normalized;
    }

    private Course resolveCourse(UUID courseId, Department department) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new IllegalArgumentException("Ders bulunamadı"));
        if (course.getDepartment() == null || !course.getDepartment().getId().equals(department.getId())) {
            throw new AccessDeniedException("Bu ders için program oluşturma yetkiniz yok.");
        }
        assertCourseReadyForScheduling(course, department);
        return course;
    }

    private void assertCourseReadyForScheduling(Course course, Department department) {
        if (!course.isActive()) {
            throw new IllegalArgumentException("Pasif ders programa eklenemez.");
        }
        if (course.getAcademician() == null
                || course.getAcademician().getDepartment() == null
                || !course.getAcademician().getDepartment().getId().equals(department.getId())) {
            throw new IllegalArgumentException("Dersin akademisyen atamasi bolum ile uyumlu degil.");
        }
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

    private List<WeeklySchedule> resolveScheduleGroup(WeeklySchedule schedule) {
        if (schedule.getScheduleGroupId() == null) {
            return List.of(schedule);
        }
        return weeklyScheduleRepository.findAllByScheduleGroupId(schedule.getScheduleGroupId()).stream()
                .sorted(Comparator.comparing(WeeklySchedule::getTimeSlot))
                .toList();
    }

    private Set<UUID> resolveExcludedScheduleIds(UUID excludeScheduleId, Department department) {
        if (excludeScheduleId == null) {
            return Set.of();
        }
        WeeklySchedule schedule = weeklyScheduleRepository.findWithDetailsById(excludeScheduleId)
                .orElseThrow(() -> new IllegalArgumentException("Ders programı bulunamadı"));
        assertScheduleAccess(schedule, department);
        return resolveScheduleGroup(schedule).stream().map(WeeklySchedule::getId).collect(Collectors.toSet());
    }

    private void assertRemainingHoursSufficient(Course course, Department department, int requestedSlotCount, Set<UUID> excludedIds) {
        int requiredHours = course.getTheoreticalHours() + course.getPracticalHours();
        int scheduledHours = weeklyScheduleRepository.findAllByCourse_Department_IdAndCourse_SemesterOrderByDayOfWeekAscTimeSlotAsc(department.getId(), course.getSemester()).stream()
                .filter(schedule -> schedule.getCourse().getId().equals(course.getId()))
                .filter(schedule -> !isExcluded(schedule, excludedIds))
                .mapToInt(schedule -> 1)
                .sum();
        int remainingHours = requiredHours - scheduledHours;
        if (requestedSlotCount > remainingHours) {
            throw new IllegalArgumentException("Seçilen ders saati dersin kalan haftalık saatini aşıyor. Kalan: " + Math.max(remainingHours, 0));
        }
    }

    private void assertScheduleSelectionAvailable(Course course, Department department, Classroom classroom, String dayOfWeek, List<String> selectedSlots, Set<UUID> excludedIds) {
        List<ScheduleConflictItem> conflicts = collectScheduleConflicts(course, department, classroom, dayOfWeek, selectedSlots, excludedIds);
        if (!conflicts.isEmpty()) {
            throw new ScheduleConflictException(
                    resolveConflictCode(conflicts),
                    "Bu saate ders koyulamaz.",
                    conflicts.stream().map(ScheduleConflictItem::detail).distinct().toList()
            );
        }
    }

    private List<ScheduleConflictItem> collectScheduleConflicts(Course course, Department department, Classroom classroom, String dayOfWeek, List<String> selectedSlots, Set<UUID> excludedIds) {
        List<ScheduleConflictItem> conflicts = new ArrayList<>();
        for (String slot : selectedSlots) {
            findClassroomConflict(classroom, dayOfWeek, slot, excludedIds)
                    .ifPresent(conflict -> conflicts.add(new ScheduleConflictItem(CLASSROOM_CONFLICT, classroomConflictDetail(classroom, conflict, dayOfWeek, slot))));
            findAcademicianConflict(course, dayOfWeek, slot, excludedIds)
                    .ifPresent(conflict -> conflicts.add(new ScheduleConflictItem(ACADEMICIAN_CONFLICT, academicianConflictDetail(course, conflict, dayOfWeek, slot))));
            findGradeConflict(course, department, dayOfWeek, slot, excludedIds)
                    .ifPresent(conflict -> conflicts.add(new ScheduleConflictItem(STUDENT_GROUP_CONFLICT, studentGroupConflictDetail(course, conflict, dayOfWeek, slot))));
        }
        return conflicts;
    }

    private String resolveConflictCode(List<ScheduleConflictItem> conflicts) {
        return conflicts.stream().map(ScheduleConflictItem::code).distinct().count() == 1
                ? conflicts.get(0).code()
                : SCHEDULE_CONFLICT;
    }

    private Optional<WeeklySchedule> findGradeConflict(Course course, String dayOfWeek, String timeSlot, Set<UUID> excludedIds) {
        return findGradeConflict(course, course.getDepartment(), dayOfWeek, timeSlot, excludedIds);
    }

    private Optional<WeeklySchedule> findGradeConflict(Course course, Department department, String dayOfWeek, String timeSlot, Set<UUID> excludedIds) {
        if (course.getCourseType() != CourseType.ZORUNLU || department == null) {
            return Optional.empty();
        }
        return weeklyScheduleRepository
                .findAllByCourse_Department_IdAndCourse_GradeAndDayOfWeekAndTimeSlot(department.getId(), course.getGrade(), dayOfWeek, timeSlot)
                .stream()
                .filter(schedule -> !isExcluded(schedule, excludedIds))
                .filter(schedule -> schedule.getCourse() != null)
                .filter(schedule -> !schedule.getCourse().getId().equals(course.getId()))
                .filter(schedule -> schedule.getCourse().getCourseType() == CourseType.ZORUNLU)
                .findFirst();
    }

    private Optional<WeeklySchedule> findClassroomConflict(Classroom classroom, String dayOfWeek, String timeSlot, Set<UUID> excludedIds) {
        return weeklyScheduleRepository.findAllByClassroom_IdAndDayOfWeekAndTimeSlot(classroom.getId(), dayOfWeek, timeSlot).stream()
                .filter(schedule -> !isExcluded(schedule, excludedIds))
                .findFirst();
    }

    private boolean isExcluded(WeeklySchedule schedule, Set<UUID> excludedIds) {
        UUID scheduleId = schedule.getId();
        return scheduleId != null && excludedIds.contains(scheduleId);
    }

    private Optional<WeeklySchedule> findAcademicianConflict(Course course, String dayOfWeek, String timeSlot, Set<UUID> excludedIds) {
        return weeklyScheduleRepository.findAllByCourse_Academician_IdAndDayOfWeekAndTimeSlot(course.getAcademician().getId(), dayOfWeek, timeSlot).stream()
                .filter(schedule -> !isExcluded(schedule, excludedIds))
                .findFirst();
    }

    private AvailableClassroomResponse toAvailableClassroomResponse(Classroom classroom, Course course, String dayOfWeek, List<String> selectedSlots, Set<UUID> excludedIds) {
        List<ScheduleConflictItem> conflicts = course == null
                ? selectedSlots.stream()
                        .map(slot -> findClassroomConflict(classroom, dayOfWeek, slot, excludedIds)
                                .map(conflict -> new ScheduleConflictItem(CLASSROOM_CONFLICT, classroomConflictDetail(classroom, conflict, dayOfWeek, slot))))
                        .filter(Optional::isPresent)
                        .map(Optional::get)
                        .toList()
                : collectScheduleConflicts(course, course.getDepartment(), classroom, dayOfWeek, selectedSlots, excludedIds);
        Optional<Integer> studentCount = Optional.empty();
        Boolean capacitySufficient = null;
        Optional<ScheduleConflictItem> capacityWarning = Optional.empty();

        if (course != null) {
            studentCount = resolveStudentCount(course);
            capacitySufficient = studentCount.map(count -> classroom.getCapacity() >= count).orElse(null);
            if (Boolean.FALSE.equals(capacitySufficient)) {
                capacityWarning = Optional.of(new ScheduleConflictItem(
                        CAPACITY_CONFLICT,
                        "Bu derslik yeterli kapasiteye sahip değil. Ders: " + studentCount.orElse(0) + " öğrenci. Derslik: " + classroom.getCode() + " - " + classroom.getCapacity() + " kişi."
                ));
            }
        }

        boolean timeSlotAvailable = conflicts.stream().noneMatch(conflict -> CLASSROOM_CONFLICT.equals(conflict.code()));
        boolean selectable = conflicts.isEmpty();
        boolean available = selectable && !Boolean.FALSE.equals(capacitySufficient);
        List<ScheduleConflictItem> visibleConflicts = new ArrayList<>(conflicts);
        capacityWarning.ifPresent(visibleConflicts::add);

        return new AvailableClassroomResponse(
                classroom.getId(),
                classroom.getCode(),
                classroom.getName(),
                classroom.getCapacity(),
                classroom.getType(),
                available,
                resolveAvailabilityMessage(visibleConflicts, studentCount),
                timeSlotAvailable,
                capacitySufficient,
                studentCount.orElse(null),
                visibleConflicts.isEmpty() ? null : resolveConflictCode(visibleConflicts),
                visibleConflicts.stream().map(ScheduleConflictItem::detail).distinct().toList(),
                selectable
        );
    }

    private Comparator<AvailableClassroomResponse> availableClassroomComparator() {
        return Comparator
                .comparingInt(this::availabilityRank)
                .thenComparingInt(this::capacityDistance)
                .thenComparing(AvailableClassroomResponse::code);
    }

    private int availabilityRank(AvailableClassroomResponse classroom) {
        if (classroom.selectable() && !Boolean.FALSE.equals(classroom.capacitySufficient())) {
            return 0;
        }
        if (classroom.selectable()) {
            return 1;
        }
        return 2;
    }

    private int capacityDistance(AvailableClassroomResponse classroom) {
        if (classroom.studentCount() == null || classroom.capacity() == null) {
            return Integer.MAX_VALUE;
        }
        if (Boolean.FALSE.equals(classroom.capacitySufficient())) {
            return classroom.studentCount() - classroom.capacity();
        }
        return classroom.capacity() - classroom.studentCount();
    }

    private String resolveAvailabilityMessage(
            List<ScheduleConflictItem> conflicts,
            Optional<Integer> studentCount
    ) {
        if (!conflicts.isEmpty()) {
            return conflicts.get(0).detail();
        }
        if (studentCount.isEmpty()) {
            return "Ders öğrenci sayısı mevcut veri modelinde bulunmadığı için kapasite doğrulanamadı.";
        }
        return null;
    }

    private String classroomConflictDetail(Classroom classroom, WeeklySchedule conflict, String dayOfWeek, String slot) {
        Course conflictCourse = conflict.getCourse();
        String courseDetail = conflictCourse != null
                ? conflictCourse.getCode() + " - " + conflictCourse.getName()
                : "Başka bir ders";
        return classroom.getCode() + " dersliği bu saatlerde dolu. " + courseDetail + " - " + dayLabel(dayOfWeek) + " " + slot;
    }

    private String academicianConflictDetail(Course course, WeeklySchedule conflict, String dayOfWeek, String slot) {
        Course conflictCourse = conflict.getCourse();
        String courseDetail = conflictCourse != null
                ? conflictCourse.getCode() + " - " + conflictCourse.getName()
                : "başka bir ders";
        return formatAcademicianName(course.getAcademician()) + " bu saatlerde başka bir derse atanmıştır. " + courseDetail + " - " + dayLabel(dayOfWeek) + " " + slot;
    }

    private String studentGroupConflictDetail(Course course, WeeklySchedule conflict, String dayOfWeek, String slot) {
        Course conflictCourse = conflict.getCourse();
        String courseDetail = conflictCourse != null
                ? conflictCourse.getCode() + " - " + conflictCourse.getName()
                : "başka bir ders";
        return course.getGrade() + ". sınıf öğrencilerinin bu saatlerde başka bir dersi bulunuyor. " + courseDetail + " - " + dayLabel(dayOfWeek) + " " + slot;
    }

    private Optional<Integer> resolveStudentCount(Course course) {
        return Optional.of(course.getStudentCount());
    }

    private WeeklySchedule newSchedule(Course course, Classroom classroom, String dayOfWeek, String timeSlot, UUID groupId) {
        WeeklySchedule schedule = new WeeklySchedule();
        schedule.setCourse(course);
        schedule.setClassroom(classroom);
        schedule.setDayOfWeek(dayOfWeek);
        schedule.setTimeSlot(timeSlot);
        schedule.setScheduleGroupId(groupId);
        return schedule;
    }

    public WeeklyScheduleResponse toResponse(WeeklySchedule schedule) {
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
                course.getSemester(),
                schedule.getScheduleGroupId()
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

    private String normalizeDay(String dayOfWeek) {
        String normalized = dayOfWeek.trim().toUpperCase();
        if (!DAYS.contains(normalized)) {
            throw new IllegalArgumentException("Geçersiz gün seçimi.");
        }
        return normalized;
    }

    private String normalizeTime(String time) {
        return parseTime(time).format(TIME_FORMATTER);
    }

    private LocalTime parseTime(String time) {
        try {
            return LocalTime.parse(time.trim(), TIME_FORMATTER);
        } catch (DateTimeParseException exception) {
            throw new IllegalArgumentException("Saat bilgisi HH:mm formatında olmalıdır.");
        }
    }

    private String normalizeTimeSlotFormat(String timeSlot) {
        String[] parts = timeSlot.trim().split("-");
        if (parts.length != 2) {
            throw new IllegalArgumentException("Geçersiz zaman bloğu seçimi.");
        }
        LocalTime start = parseTime(parts[0]);
        LocalTime end = parseTime(parts[1]);
        if (!start.isBefore(end) || Duration.between(start, end).toMinutes() <= 0) {
            throw new IllegalArgumentException("Geçersiz zaman bloğu seçimi.");
        }
        return start.format(TIME_FORMATTER) + "-" + end.format(TIME_FORMATTER);
    }

    private String conflictMessage(Classroom classroom, String dayOfWeek, String timeSlot) {
        return classroom.getCode() + " sınıfı " + DAY_LABELS.getOrDefault(dayOfWeek, dayOfWeek) + " " + timeSlot + " zamanında kullanımdadır.";
    }

    private String dayLabel(String dayOfWeek) {
        return DAY_LABELS.getOrDefault(dayOfWeek, dayOfWeek);
    }

    private String formatAcademicianName(Academician academician) {
        return (academician.getTitle() + " " + academician.getFirstName() + " " + academician.getLastName()).trim();
    }

    private record ScheduleConflictItem(String code, String detail) {
    }
}
