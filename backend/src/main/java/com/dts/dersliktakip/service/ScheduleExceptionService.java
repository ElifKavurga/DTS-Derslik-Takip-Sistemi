package com.dts.dersliktakip.service;

import com.dts.dersliktakip.dto.CreateExtraLessonRequest;
import com.dts.dersliktakip.dto.CreateScheduleCancellationRequest;
import com.dts.dersliktakip.dto.CreateScheduleMakeupRequest;
import com.dts.dersliktakip.dto.ScheduleExceptionResponse;
import com.dts.dersliktakip.dto.ScheduleTimeConfigurationResponse;
import com.dts.dersliktakip.entity.Academician;
import com.dts.dersliktakip.entity.Classroom;
import com.dts.dersliktakip.entity.Course;
import com.dts.dersliktakip.entity.CourseType;
import com.dts.dersliktakip.entity.Department;
import com.dts.dersliktakip.entity.ScheduleException;
import com.dts.dersliktakip.entity.ScheduleExceptionType;
import com.dts.dersliktakip.entity.User;
import com.dts.dersliktakip.entity.WeeklySchedule;
import com.dts.dersliktakip.entity.Role;
import com.dts.dersliktakip.exception.ScheduleConflictException;
import com.dts.dersliktakip.repository.AcademicianRepository;
import com.dts.dersliktakip.repository.ClassroomRepository;
import com.dts.dersliktakip.repository.CourseRepository;
import com.dts.dersliktakip.repository.ScheduleExceptionRepository;
import com.dts.dersliktakip.repository.WeeklyScheduleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ScheduleExceptionService {

    private static final String CLASSROOM_CONFLICT = "CLASSROOM_CONFLICT";
    private static final String ACADEMICIAN_CONFLICT = "ACADEMICIAN_CONFLICT";
    private static final String STUDENT_GROUP_CONFLICT = "STUDENT_GROUP_CONFLICT";
    private static final String CAPACITY_CONFLICT = "CAPACITY_CONFLICT";
    private static final String DUPLICATE_EXCEPTION = "DUPLICATE_EXCEPTION";
    private static final String SCHEDULE_CONFLICT = "SCHEDULE_CONFLICT";

    private final ScheduleExceptionRepository scheduleExceptionRepository;
    private final WeeklyScheduleRepository weeklyScheduleRepository;
    private final CourseRepository courseRepository;
    private final ClassroomRepository classroomRepository;
    private final AcademicianRepository academicianRepository;
    private final WeeklyScheduleService weeklyScheduleService;
    private final AccessScopeService accessScopeService;

    @Transactional(readOnly = true)
    public List<ScheduleExceptionResponse> getMyExceptions(User currentUser, LocalDate weekStart, LocalDate weekEnd) {
        if (currentUser.getRoles() == null || !currentUser.getRoles().contains(Role.ACADEMICIAN)) {
            Department department = accessScopeService.requireDepartmentScope(currentUser);
            List<ScheduleException> exceptions = weekStart != null && weekEnd != null
                    ? scheduleExceptionRepository.findAllByCourse_Department_IdAndTargetDateBetweenOrderByTargetDateAscTimeSlotAsc(department.getId(), weekStart, weekEnd)
                    : scheduleExceptionRepository.findAllByCourse_Department_IdOrderByTargetDateDescTimeSlotAsc(department.getId());
            return exceptions.stream().map(this::toResponse).toList();
        }

        Academician academician = resolveAcademician(currentUser);
        List<ScheduleException> exceptions = weekStart != null && weekEnd != null
                ? scheduleExceptionRepository.findAllByAcademician_IdAndTargetDateBetweenOrderByTargetDateAscTimeSlotAsc(academician.getId(), weekStart, weekEnd)
                : scheduleExceptionRepository.findAllByAcademician_IdOrderByTargetDateDescTimeSlotAsc(academician.getId());
        return exceptions.stream().map(this::toResponse).toList();
    }

    @Transactional
    public ScheduleExceptionResponse cancelLesson(CreateScheduleCancellationRequest request, User currentUser) {
        Academician academician = resolveAcademician(currentUser);
        WeeklySchedule schedule = resolveOwnedSchedule(request.scheduleId(), academician);

        if (!matchesScheduleDay(request.date(), schedule)) {
            throw new IllegalArgumentException("İptal tarihi seçilen dersin haftalık program günüyle eşleşmiyor.");
        }
        if (scheduleExceptionRepository.existsByOriginalSchedule_IdAndOriginalDateAndType(schedule.getId(), request.date(), ScheduleExceptionType.CANCELLED)) {
            throw new ScheduleConflictException(DUPLICATE_EXCEPTION, "Ders zaten iptal edilmiş.", List.of("Seçilen tarih için iptal kaydı mevcut."));
        }

        ScheduleException exception = new ScheduleException();
        exception.setType(ScheduleExceptionType.CANCELLED);
        exception.setOriginalSchedule(schedule);
        exception.setCourse(schedule.getCourse());
        exception.setAcademician(academician);
        exception.setOriginalDate(request.date());
        exception.setTargetDate(request.date());
        exception.setTimeSlot(schedule.getTimeSlot());
        exception.setSlotCount(1);
        exception.setClassroom(schedule.getClassroom());

        return toResponse(scheduleExceptionRepository.save(exception));
    }

    @Transactional
    public ScheduleExceptionResponse createMakeup(CreateScheduleMakeupRequest request, User currentUser) {
        Academician academician = resolveAcademician(currentUser);
        WeeklySchedule schedule = resolveOwnedSchedule(request.scheduleId(), academician);
        int slotCount = normalizeSlotCount(request.slotCount());
        List<String> selectedSlots = resolveSelectedSlots(currentUser, request.timeSlot(), slotCount);
        Classroom classroom = resolveClassroom(request.classroomId(), academician.getDepartment());

        if (!matchesScheduleDay(request.originalDate(), schedule)) {
            throw new IllegalArgumentException("Telafi kaynağı seçilen dersin haftalık program günüyle eşleşmiyor.");
        }
        if (scheduleExceptionRepository.existsByOriginalSchedule_IdAndOriginalDateAndTypeIn(
                schedule.getId(),
                request.originalDate(),
                List.of(ScheduleExceptionType.MAKEUP)
        )) {
            throw new ScheduleConflictException(DUPLICATE_EXCEPTION, "Bu ders için telafi zaten oluşturulmuş.", List.of("Aynı kaynak ders/tarih için ikinci telafi oluşturulamaz."));
        }

        assertCapacitySufficient(schedule.getCourse(), classroom);
        assertTargetAvailable(schedule.getCourse(), classroom, request.makeupDate(), selectedSlots, Set.of(schedule.getId()));

        ScheduleException exception = new ScheduleException();
        exception.setType(ScheduleExceptionType.MAKEUP);
        exception.setOriginalSchedule(schedule);
        exception.setCourse(schedule.getCourse());
        exception.setAcademician(academician);
        exception.setOriginalDate(request.originalDate());
        exception.setTargetDate(request.makeupDate());
        exception.setTimeSlot(selectedSlots.get(0));
        exception.setSlotCount(slotCount);
        exception.setClassroom(classroom);

        return toResponse(scheduleExceptionRepository.save(exception));
    }

    @Transactional
    public ScheduleExceptionResponse createExtraLesson(CreateExtraLessonRequest request, User currentUser) {
        Academician academician = resolveAcademician(currentUser);
        Course course = resolveOwnedCourse(request.courseId(), academician);
        int slotCount = normalizeSlotCount(request.slotCount());
        List<String> selectedSlots = resolveSelectedSlots(currentUser, request.timeSlot(), slotCount);
        Classroom classroom = resolveClassroom(request.classroomId(), academician.getDepartment());

        if (scheduleExceptionRepository.existsByCourse_IdAndTargetDateAndTimeSlotAndType(course.getId(), request.date(), selectedSlots.get(0), ScheduleExceptionType.EXTRA)) {
            throw new ScheduleConflictException(DUPLICATE_EXCEPTION, "Ek ders zaten oluşturulmuş.", List.of("Aynı ders, tarih ve saat için ikinci ek ders oluşturulamaz."));
        }

        assertCapacitySufficient(course, classroom);
        assertTargetAvailable(course, classroom, request.date(), selectedSlots, Set.of());

        ScheduleException exception = new ScheduleException();
        exception.setType(ScheduleExceptionType.EXTRA);
        exception.setCourse(course);
        exception.setAcademician(academician);
        exception.setTargetDate(request.date());
        exception.setTimeSlot(selectedSlots.get(0));
        exception.setSlotCount(slotCount);
        exception.setClassroom(classroom);

        return toResponse(scheduleExceptionRepository.save(exception));
    }

    private void assertTargetAvailable(Course course, Classroom classroom, LocalDate date, List<String> selectedSlots, Set<UUID> excludedWeeklyScheduleIds) {
        String dayOfWeek = toScheduleDay(date);
        List<ConflictItem> conflicts = new ArrayList<>();

        for (String slot : selectedSlots) {
            weeklyScheduleRepository.findAllByClassroom_IdAndDayOfWeekAndTimeSlot(classroom.getId(), dayOfWeek, slot).stream()
                    .filter(schedule -> !excludedWeeklyScheduleIds.contains(schedule.getId()))
                    .findFirst()
                    .ifPresent(conflict -> conflicts.add(new ConflictItem(CLASSROOM_CONFLICT, classroom.getCode() + " dersliği bu saatte dolu.")));

            weeklyScheduleRepository.findAllByCourse_Academician_IdAndDayOfWeekAndTimeSlot(course.getAcademician().getId(), dayOfWeek, slot).stream()
                    .filter(schedule -> !excludedWeeklyScheduleIds.contains(schedule.getId()))
                    .findFirst()
                    .ifPresent(conflict -> conflicts.add(new ConflictItem(ACADEMICIAN_CONFLICT, "Bu akademisyenin bu saatte başka bir dersi bulunmaktadır.")));

            findGradeConflict(course, dayOfWeek, slot, excludedWeeklyScheduleIds)
                    .ifPresent(conflict -> conflicts.add(new ConflictItem(STUDENT_GROUP_CONFLICT, course.getGrade() + ". sınıf öğrencilerinin bu saatte başka bir dersi bulunmaktadır.")));

            scheduleExceptionRepository.findAllByTargetDateAndTimeSlot(date, slot).stream()
                    .filter(exception -> exception.getType() != ScheduleExceptionType.CANCELLED)
                    .filter(exception -> exception.getClassroom() != null && exception.getClassroom().getId().equals(classroom.getId()))
                    .findFirst()
                    .ifPresent(conflict -> conflicts.add(new ConflictItem(CLASSROOM_CONFLICT, classroom.getCode() + " dersliği bu saatte başka bir istisna dersi için kullanılıyor.")));

            scheduleExceptionRepository.findAllByTargetDateAndTimeSlot(date, slot).stream()
                    .filter(exception -> exception.getType() != ScheduleExceptionType.CANCELLED)
                    .filter(exception -> exception.getAcademician().getId().equals(course.getAcademician().getId()))
                    .findFirst()
                    .ifPresent(conflict -> conflicts.add(new ConflictItem(ACADEMICIAN_CONFLICT, "Bu akademisyenin bu saatte başka bir istisna dersi bulunmaktadır.")));
        }

        if (!conflicts.isEmpty()) {
            throw new ScheduleConflictException(resolveConflictCode(conflicts), "Bu saate ders eklenemez.", conflicts.stream().map(ConflictItem::detail).distinct().toList());
        }
    }

    private Optional<WeeklySchedule> findGradeConflict(Course course, String dayOfWeek, String slot, Set<UUID> excludedWeeklyScheduleIds) {
        if (course.getCourseType() != CourseType.ZORUNLU) {
            return Optional.empty();
        }
        return weeklyScheduleRepository
                .findAllByCourse_Department_IdAndCourse_GradeAndDayOfWeekAndTimeSlot(course.getDepartment().getId(), course.getGrade(), dayOfWeek, slot)
                .stream()
                .filter(schedule -> !excludedWeeklyScheduleIds.contains(schedule.getId()))
                .filter(schedule -> schedule.getCourse() != null)
                .filter(schedule -> !schedule.getCourse().getId().equals(course.getId()))
                .filter(schedule -> schedule.getCourse().getCourseType() == CourseType.ZORUNLU)
                .findFirst();
    }

    private void assertCapacitySufficient(Course course, Classroom classroom) {
        if (classroom.getCapacity() == null || classroom.getCapacity() <= 0) {
            throw new ScheduleConflictException(CAPACITY_CONFLICT, "Bu derslik yeterli kapasiteye sahip değil.", List.of("Derslik kapasitesi tanımlı değil."));
        }
    }

    private List<String> resolveSelectedSlots(User currentUser, String timeSlot, int slotCount) {
        ScheduleTimeConfigurationResponse config = weeklyScheduleService.getTimeConfiguration(currentUser);
        List<String> slots = config.slots().stream().map(slot -> slot.value()).toList();
        int startIndex = slots.indexOf(timeSlot.trim());
        if (startIndex < 0) {
            throw new IllegalArgumentException("Geçersiz zaman bloğu seçimi.");
        }
        if (startIndex + slotCount > slots.size()) {
            throw new IllegalArgumentException("Seçilen ders saati program bitişini aşıyor.");
        }
        return slots.subList(startIndex, startIndex + slotCount);
    }

    private int normalizeSlotCount(Integer slotCount) {
        return slotCount == null ? 1 : slotCount;
    }

    private WeeklySchedule resolveOwnedSchedule(UUID scheduleId, Academician academician) {
        WeeklySchedule schedule = weeklyScheduleRepository.findWithDetailsById(scheduleId)
                .orElseThrow(() -> new IllegalArgumentException("Ders programı bulunamadı."));
        if (schedule.getCourse() == null
                || schedule.getCourse().getAcademician() == null
                || !schedule.getCourse().getAcademician().getId().equals(academician.getId())) {
            throw new AccessDeniedException("Bu ders için işlem yapma yetkiniz yok.");
        }
        return schedule;
    }

    private Course resolveOwnedCourse(UUID courseId, Academician academician) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new IllegalArgumentException("Ders bulunamadı."));
        if (course.getAcademician() == null || !course.getAcademician().getId().equals(academician.getId())) {
            throw new AccessDeniedException("Bu ders için işlem yapma yetkiniz yok.");
        }
        return course;
    }

    private Classroom resolveClassroom(UUID classroomId, Department department) {
        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new IllegalArgumentException("Derslik bulunamadı."));
        if (classroom.getFloor() == null
                || classroom.getFloor().getBuilding() == null
                || classroom.getFloor().getBuilding().getFaculty() == null
                || !classroom.getFloor().getBuilding().getFaculty().getId().equals(department.getFaculty().getId())) {
            throw new AccessDeniedException("Bu derslik için yetkiniz yok.");
        }
        return classroom;
    }

    private boolean matchesScheduleDay(LocalDate date, WeeklySchedule schedule) {
        return toScheduleDay(date).equals(schedule.getDayOfWeek());
    }

    private String toScheduleDay(LocalDate date) {
        DayOfWeek day = date.getDayOfWeek();
        if (day == DayOfWeek.SATURDAY || day == DayOfWeek.SUNDAY) {
            throw new IllegalArgumentException("Hafta sonu için ders istisnası oluşturulamaz.");
        }
        return day.name();
    }

    private Academician resolveAcademician(User currentUser) {
        return academicianRepository.findByEmail(currentUser.getEmail())
                .orElseThrow(() -> new AccessDeniedException("Akademisyen kaydı bulunamadı."));
    }

    private String resolveConflictCode(List<ConflictItem> conflicts) {
        return conflicts.stream().map(ConflictItem::code).distinct().count() == 1
                ? conflicts.get(0).code()
                : SCHEDULE_CONFLICT;
    }

    private ScheduleExceptionResponse toResponse(ScheduleException exception) {
        Course course = exception.getCourse();
        Academician academician = exception.getAcademician();
        Classroom classroom = exception.getClassroom();
        return new ScheduleExceptionResponse(
                exception.getId(),
                exception.getType(),
                exception.getOriginalSchedule() == null ? null : exception.getOriginalSchedule().getId(),
                course.getId(),
                course.getCode(),
                course.getName(),
                academician.getId(),
                (academician.getTitle() + " " + academician.getFirstName() + " " + academician.getLastName()).trim(),
                exception.getOriginalDate(),
                exception.getTargetDate(),
                exception.getTargetDate().getDayOfWeek().name().toUpperCase(Locale.ROOT),
                exception.getTimeSlot(),
                exception.getSlotCount(),
                classroom == null ? null : classroom.getId(),
                classroom == null ? null : classroom.getCode(),
                classroom == null ? null : classroom.getName()
        );
    }

    private record ConflictItem(String code, String detail) {
    }
}
