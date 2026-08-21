package com.dts.dersliktakip.service;

import com.dts.dersliktakip.dto.ClassroomAvailabilityStatus;
import com.dts.dersliktakip.dto.PublicBuildingResponse;
import com.dts.dersliktakip.dto.PublicClassroomDailyScheduleItemResponse;
import com.dts.dersliktakip.dto.PublicClassroomDailyScheduleResponse;
import com.dts.dersliktakip.dto.PublicFacultyResponse;
import com.dts.dersliktakip.dto.PublicFloorDetailResponse;
import com.dts.dersliktakip.dto.PublicFloorResponse;
import com.dts.dersliktakip.dto.PublicSpaceObjectResponse;
import com.dts.dersliktakip.dto.PublicDepartmentResponse;
import com.dts.dersliktakip.dto.PublicWeeklyScheduleDayResponse;
import com.dts.dersliktakip.dto.PublicWeeklyScheduleResponse;
import com.dts.dersliktakip.dto.PublicAcademicianResponse;
import com.dts.dersliktakip.dto.PublicAcademicianListResponse;
import com.dts.dersliktakip.entity.Academician;
import com.dts.dersliktakip.entity.Building;
import com.dts.dersliktakip.entity.Classroom;
import com.dts.dersliktakip.entity.ClassroomType;
import com.dts.dersliktakip.entity.Course;
import com.dts.dersliktakip.entity.Department;
import com.dts.dersliktakip.entity.Faculty;
import com.dts.dersliktakip.entity.Floor;
import com.dts.dersliktakip.entity.FloorLayout;
import com.dts.dersliktakip.entity.ScheduleException;
import com.dts.dersliktakip.entity.ScheduleExceptionType;
import com.dts.dersliktakip.entity.SpaceObject;
import com.dts.dersliktakip.entity.SpaceObjectStatus;
import com.dts.dersliktakip.entity.SpaceObjectType;
import com.dts.dersliktakip.entity.WeeklySchedule;
import com.dts.dersliktakip.exception.ResourceNotFoundException;
import com.dts.dersliktakip.repository.AcademicianRepository;
import com.dts.dersliktakip.repository.BuildingRepository;
import com.dts.dersliktakip.repository.ClassroomRepository;
import com.dts.dersliktakip.repository.CourseRepository;
import com.dts.dersliktakip.repository.DepartmentRepository;
import com.dts.dersliktakip.repository.DepartmentScheduleConfigRepository;
import com.dts.dersliktakip.repository.FacultyRepository;
import com.dts.dersliktakip.repository.FloorLayoutRepository;
import com.dts.dersliktakip.repository.FloorRepository;
import com.dts.dersliktakip.repository.ScheduleExceptionRepository;
import com.dts.dersliktakip.repository.SpaceObjectRepository;
import com.dts.dersliktakip.repository.WeeklyScheduleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PublicCampusService {

    private static final ZoneId APPLICATION_ZONE = ZoneId.of("Europe/Istanbul");
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");
    private static final Map<String, String> DAY_LABELS = Map.of(
            "MONDAY", "Pazartesi",
            "TUESDAY", "Salı",
            "WEDNESDAY", "Çarşamba",
            "THURSDAY", "Perşembe",
            "FRIDAY", "Cuma",
            "SATURDAY", "Cumartesi",
            "SUNDAY", "Pazar"
    );

    private final FacultyRepository facultyRepository;
    private final BuildingRepository buildingRepository;
    private final FloorRepository floorRepository;
    private final FloorLayoutRepository floorLayoutRepository;
    private final SpaceObjectRepository spaceObjectRepository;
    private final ClassroomRepository classroomRepository;
    private final WeeklyScheduleRepository weeklyScheduleRepository;
    private final ScheduleExceptionRepository scheduleExceptionRepository;
    private final DepartmentScheduleConfigRepository departmentScheduleConfigRepository;
    private final DepartmentRepository departmentRepository;
    private final CourseRepository courseRepository;
    private final AcademicianRepository academicianRepository;

    @Transactional(readOnly = true)
    public List<PublicFacultyResponse> getFaculties() {
        return facultyRepository.findAllByOrderByNameAsc().stream()
                .map(this::toFacultyResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PublicBuildingResponse> getBuildingsByFacultyId(UUID facultyId) {
        if (!facultyRepository.existsById(facultyId)) {
            throw new ResourceNotFoundException("Fakulte bulunamadi.");
        }

        return buildingRepository.findAllByFacultyIdOrderByNameAsc(facultyId).stream()
                .map(this::toBuildingResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public PublicBuildingResponse getBuildingByFacultyId(UUID facultyId, UUID buildingId) {
        if (!facultyRepository.existsById(facultyId)) {
            throw new ResourceNotFoundException("Fakulte bulunamadi.");
        }

        Building building = buildingRepository.findByIdAndFacultyId(buildingId, facultyId)
                .orElseThrow(() -> new ResourceNotFoundException("Bina bulunamadi."));
        return toBuildingResponse(building);
    }

    @Transactional(readOnly = true)
    public List<PublicFloorResponse> getFloorsByBuildingId(UUID buildingId) {
        if (!buildingRepository.existsById(buildingId)) {
            throw new ResourceNotFoundException("Bina bulunamadi.");
        }

        return floorRepository.findAllByBuildingIdOrderByLevelAsc(buildingId).stream()
                .map(this::toFloorResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public PublicFloorDetailResponse getFloorView(UUID buildingId, UUID floorId) {
        Floor floor = floorRepository.findByIdAndBuildingId(floorId, buildingId)
                .orElseThrow(() -> new ResourceNotFoundException("Kat bulunamadi."));

        FloorLayout layout = floorLayoutRepository.findByFloorId(floorId).orElse(null);
        Map<UUID, ClassroomStatusSnapshot> classroomStatuses = resolveClassroomStatuses(floorId);
        List<PublicSpaceObjectResponse> placedObjects = spaceObjectRepository
                .findAllByFloorIdOrderBySlotRowAscSlotColumnAscPositionYAscPositionXAsc(floorId)
                .stream()
                .filter(spaceObject -> isTeachingSpace(spaceObject.getType()))
                .map(spaceObject -> toSpaceObjectResponse(spaceObject, classroomStatuses))
                .toList();
        Set<UUID> placedClassroomIds = placedObjects.stream()
                .map(PublicSpaceObjectResponse::getClassroomId)
                .filter(id -> id != null)
                .collect(Collectors.toSet());
        List<PublicSpaceObjectResponse> unplacedClassrooms = classroomRepository.findAllByFloorIdOrderByCodeAsc(floorId)
                .stream()
                .filter(classroom -> !placedClassroomIds.contains(classroom.getId()))
                .map(classroom -> toUnplacedClassroomResponse(classroom, classroomStatuses))
                .toList();
        List<PublicSpaceObjectResponse> objects = java.util.stream.Stream
                .concat(placedObjects.stream(), unplacedClassrooms.stream())
                .toList();

        return PublicFloorDetailResponse.builder()
                .id(floor.getId())
                .name(floor.getName())
                .level(floor.getLevel())
                .buildingId(floor.getBuilding().getId())
                .buildingName(floor.getBuilding().getName())
                .facultyId(floor.getBuilding().getFaculty().getId())
                .facultyName(floor.getBuilding().getFaculty().getName())
                .backgroundImageBase64(layout != null ? layout.getBackgroundImageBase64() : null)
                .backgroundImageType(layout != null ? layout.getBackgroundImageType() : null)
                .backgroundX(layout != null ? layout.getBackgroundX() : 0.0)
                .backgroundY(layout != null ? layout.getBackgroundY() : 0.0)
                .backgroundWidth(layout != null ? layout.getBackgroundWidth() : null)
                .backgroundHeight(layout != null ? layout.getBackgroundHeight() : null)
                .backgroundOpacity(layout != null ? layout.getBackgroundOpacity() : 0.35)
                .objects(objects)
                .build();
    }

    @Transactional(readOnly = true)
    public PublicClassroomDailyScheduleResponse getClassroomDailySchedule(UUID classroomId, LocalDate date) {
        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new ResourceNotFoundException("Derslik bulunamadi."));
        LocalDate targetDate = date != null ? date : LocalDate.now(APPLICATION_ZONE);
        String dayOfWeek = targetDate.getDayOfWeek().name();

        Set<UUID> cancelledScheduleIds = scheduleExceptionRepository
                .findAllByOriginalDateAndOriginalSchedule_Classroom_Id(targetDate, classroomId)
                .stream()
                .filter(exception -> exception.getType() == ScheduleExceptionType.CANCELLED)
                .filter(exception -> exception.getOriginalSchedule() != null)
                .map(exception -> exception.getOriginalSchedule().getId())
                .collect(Collectors.toSet());

        List<DailyScheduleEntry> entries = new ArrayList<>();
        weeklyScheduleRepository.findAllByClassroom_IdAndDayOfWeekOrderByTimeSlotAsc(classroomId, dayOfWeek)
                .stream()
                .filter(schedule -> !cancelledScheduleIds.contains(schedule.getId()))
                .map(this::toDailyScheduleEntry)
                .forEach(entries::add);

        scheduleExceptionRepository.findAllByTargetDateAndClassroom_Id(targetDate, classroomId)
                .stream()
                .filter(exception -> exception.getType() != ScheduleExceptionType.CANCELLED)
                .filter(exception -> exception.getClassroom() != null)
                .filter(exception -> exception.getCourse() != null && exception.getCourse().getDepartment() != null)
                .map(this::toDailyScheduleEntry)
                .forEach(entries::add);

        List<PublicClassroomDailyScheduleItemResponse> items = mergeDailyScheduleEntries(entries);
        return new PublicClassroomDailyScheduleResponse(
                classroom.getId(),
                classroom.getCode(),
                classroom.getName(),
                targetDate,
                dayOfWeek,
                DAY_LABELS.getOrDefault(dayOfWeek, dayOfWeek),
                items
        );
    }

    @Transactional(readOnly = true)
    public PublicWeeklyScheduleResponse getClassroomWeeklySchedule(UUID classroomId, LocalDate startDate, LocalDate endDate) {
        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new ResourceNotFoundException("Derslik bulunamadi."));

        if (startDate == null || endDate == null || startDate.isAfter(endDate)) {
            throw new IllegalArgumentException("Gecerli bir tarih araligi secilmelidir.");
        }

        // Fetch all recurring weekly schedules for this classroom
        List<WeeklySchedule> weeklySchedules = weeklyScheduleRepository.findAllByClassroom_IdOrderByDayOfWeekAscTimeSlotAsc(classroomId);

        // Fetch exceptions for the date range
        List<ScheduleException> cancelledExceptions = scheduleExceptionRepository
                .findAllByOriginalDateBetweenAndOriginalSchedule_Classroom_IdOrderByOriginalDateAscTimeSlotAsc(startDate, endDate, classroomId);

        List<ScheduleException> activeExceptions = scheduleExceptionRepository
                .findAllByTargetDateBetweenAndClassroom_IdOrderByTargetDateAscTimeSlotAsc(startDate, endDate, classroomId);

        List<PublicWeeklyScheduleDayResponse> days = new ArrayList<>();
        LocalDate currentDate = startDate;

        while (!currentDate.isAfter(endDate)) {
            final LocalDate loopDate = currentDate;
            String dayOfWeek = loopDate.getDayOfWeek().name();

            Set<UUID> cancelledScheduleIds = cancelledExceptions.stream()
                    .filter(exception -> exception.getType() == ScheduleExceptionType.CANCELLED)
                    .filter(exception -> exception.getOriginalSchedule() != null)
                    .filter(exception -> exception.getOriginalDate().equals(loopDate))
                    .map(exception -> exception.getOriginalSchedule().getId())
                    .collect(Collectors.toSet());

            List<DailyScheduleEntry> dailyEntries = new ArrayList<>();

            weeklySchedules.stream()
                    .filter(schedule -> schedule.getDayOfWeek().equalsIgnoreCase(dayOfWeek))
                    .filter(schedule -> !cancelledScheduleIds.contains(schedule.getId()))
                    .map(this::toDailyScheduleEntry)
                    .forEach(dailyEntries::add);

            activeExceptions.stream()
                    .filter(exception -> exception.getType() != ScheduleExceptionType.CANCELLED)
                    .filter(exception -> exception.getClassroom() != null)
                    .filter(exception -> exception.getCourse() != null && exception.getCourse().getDepartment() != null)
                    .filter(exception -> exception.getTargetDate().equals(loopDate))
                    .map(this::toDailyScheduleEntry)
                    .forEach(dailyEntries::add);

            List<PublicClassroomDailyScheduleItemResponse> items = mergeDailyScheduleEntries(dailyEntries);

            days.add(new PublicWeeklyScheduleDayResponse(
                    loopDate,
                    dayOfWeek,
                    DAY_LABELS.getOrDefault(dayOfWeek, dayOfWeek),
                    items
            ));

            currentDate = currentDate.plusDays(1);
        }

        return new PublicWeeklyScheduleResponse(
                classroom.getId(),
                classroom.getCode(),
                classroom.getName(),
                startDate,
                endDate,
                days
        );
    }

    @Transactional(readOnly = true)
    public List<PublicDepartmentResponse> getDepartments() {
        return departmentRepository.findAllByOrderByNameAsc().stream()
                .map(this::toDepartmentResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Integer> getClassLevelsByDepartmentId(UUID departmentId) {
        if (!departmentRepository.existsById(departmentId)) {
            throw new ResourceNotFoundException("Bolum bulunamadi.");
        }
        return courseRepository.findDistinctGradesByDepartmentId(departmentId);
    }

    @Transactional(readOnly = true)
    public PublicWeeklyScheduleResponse getDepartmentWeeklySchedule(UUID departmentId, int classLevel, LocalDate startDate, LocalDate endDate) {
        Department department = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Bolum bulunamadi."));

        if (startDate == null || endDate == null || startDate.isAfter(endDate)) {
            throw new IllegalArgumentException("Gecerli bir tarih araligi secilmelidir.");
        }

        List<WeeklySchedule> weeklySchedules = weeklyScheduleRepository.findAllByCourse_Department_IdAndCourse_GradeOrderByDayOfWeekAscTimeSlotAsc(departmentId, classLevel);

        List<ScheduleException> cancelledExceptions = scheduleExceptionRepository
                .findAllByOriginalSchedule_Course_Department_IdAndOriginalSchedule_Course_GradeAndOriginalDateBetweenOrderByOriginalDateAscTimeSlotAsc(departmentId, classLevel, startDate, endDate);

        List<ScheduleException> activeExceptions = scheduleExceptionRepository
                .findAllByCourse_Department_IdAndCourse_GradeAndTargetDateBetweenOrderByTargetDateAscTimeSlotAsc(departmentId, classLevel, startDate, endDate);

        List<PublicWeeklyScheduleDayResponse> days = new ArrayList<>();
        LocalDate currentDate = startDate;

        while (!currentDate.isAfter(endDate)) {
            final LocalDate loopDate = currentDate;
            String dayOfWeek = loopDate.getDayOfWeek().name();

            Set<UUID> cancelledScheduleIds = cancelledExceptions.stream()
                    .filter(exception -> exception.getType() == ScheduleExceptionType.CANCELLED)
                    .filter(exception -> exception.getOriginalSchedule() != null)
                    .filter(exception -> exception.getOriginalDate().equals(loopDate))
                    .map(exception -> exception.getOriginalSchedule().getId())
                    .collect(Collectors.toSet());

            List<DailyScheduleEntry> dailyEntries = new ArrayList<>();

            weeklySchedules.stream()
                    .filter(schedule -> schedule.getDayOfWeek().equalsIgnoreCase(dayOfWeek))
                    .filter(schedule -> !cancelledScheduleIds.contains(schedule.getId()))
                    .map(this::toDailyScheduleEntry)
                    .forEach(dailyEntries::add);

            activeExceptions.stream()
                    .filter(exception -> exception.getType() != ScheduleExceptionType.CANCELLED)
                    .filter(exception -> exception.getTargetDate().equals(loopDate))
                    .map(this::toDailyScheduleEntry)
                    .forEach(dailyEntries::add);

            List<PublicClassroomDailyScheduleItemResponse> items = mergeDailyScheduleEntries(dailyEntries);

            days.add(new PublicWeeklyScheduleDayResponse(
                    loopDate,
                    dayOfWeek,
                    DAY_LABELS.getOrDefault(dayOfWeek, dayOfWeek),
                    items
            ));

            currentDate = currentDate.plusDays(1);
        }

        return new PublicWeeklyScheduleResponse(
                department.getId(),
                department.getCode(),
                department.getName() + " - " + classLevel + ". Sinif",
                startDate,
                endDate,
                days
        );
    }

    public List<PublicAcademicianResponse> getAcademicians() {
        return academicianRepository.findAllByOrderByFirstNameAscLastNameAsc().stream()
                .map(a -> new PublicAcademicianResponse(
                        a.getId(),
                        a.getFirstName(),
                        a.getLastName(),
                        a.getTitle(),
                        a.getFaculty().getId(),
                        a.getFaculty().getName(),
                        a.getDepartment().getId(),
                        a.getDepartment().getName()
                ))
                .toList();
    }

    public PublicWeeklyScheduleResponse getAcademicianWeeklySchedule(UUID academicianId, LocalDate startDate, LocalDate endDate) {
        Academician academician = academicianRepository.findById(academicianId)
                .orElseThrow(() -> new ResourceNotFoundException("Akademisyen bulunamadi."));

        if (startDate == null || endDate == null || startDate.isAfter(endDate)) {
            throw new IllegalArgumentException("Gecerli bir tarih araligi secilmelidir.");
        }

        List<WeeklySchedule> weeklySchedules = weeklyScheduleRepository.findAllByCourse_Academician_IdOrderByDayOfWeekAscTimeSlotAsc(academicianId);

        List<ScheduleException> cancelledExceptions = scheduleExceptionRepository
                .findAllByOriginalSchedule_Course_Academician_IdAndOriginalDateBetweenOrderByOriginalDateAscTimeSlotAsc(academicianId, startDate, endDate);

        List<ScheduleException> activeExceptions = scheduleExceptionRepository
                .findAllByAcademician_IdAndTargetDateBetweenOrderByTargetDateAscTimeSlotAsc(academicianId, startDate, endDate);

        List<PublicWeeklyScheduleDayResponse> days = new ArrayList<>();
        LocalDate currentDate = startDate;

        while (!currentDate.isAfter(endDate)) {
            final LocalDate loopDate = currentDate;
            String dayOfWeek = loopDate.getDayOfWeek().name();

            Set<UUID> cancelledScheduleIds = cancelledExceptions.stream()
                    .filter(exception -> exception.getType() == ScheduleExceptionType.CANCELLED)
                    .filter(exception -> exception.getOriginalSchedule() != null)
                    .filter(exception -> exception.getOriginalDate().equals(loopDate))
                    .map(exception -> exception.getOriginalSchedule().getId())
                    .collect(Collectors.toSet());

            List<DailyScheduleEntry> dailyEntries = new ArrayList<>();

            weeklySchedules.stream()
                    .filter(schedule -> schedule.getDayOfWeek().equalsIgnoreCase(dayOfWeek))
                    .filter(schedule -> !cancelledScheduleIds.contains(schedule.getId()))
                    .map(this::toDailyScheduleEntry)
                    .forEach(dailyEntries::add);

            activeExceptions.stream()
                    .filter(exception -> exception.getType() != ScheduleExceptionType.CANCELLED)
                    .filter(exception -> exception.getTargetDate().equals(loopDate))
                    .map(this::toDailyScheduleEntry)
                    .forEach(dailyEntries::add);

            List<PublicClassroomDailyScheduleItemResponse> items = mergeDailyScheduleEntries(dailyEntries);

            days.add(new PublicWeeklyScheduleDayResponse(
                    loopDate,
                    dayOfWeek,
                    DAY_LABELS.getOrDefault(dayOfWeek, dayOfWeek),
                    items
            ));

            currentDate = currentDate.plusDays(1);
        }

        String fullName = academicianName(academician);

        return new PublicWeeklyScheduleResponse(
                academician.getId(),
                fullName,
                fullName,
                startDate,
                endDate,
                days
        );
    }

    private PublicFacultyResponse toFacultyResponse(Faculty faculty) {
        return PublicFacultyResponse.builder()
                .id(faculty.getId())
                .name(faculty.getName())
                .code(faculty.getCode())
                .build();
    }

    private PublicDepartmentResponse toDepartmentResponse(Department department) {
        return PublicDepartmentResponse.builder()
                .id(department.getId())
                .name(department.getName())
                .code(department.getCode())
                .facultyId(department.getFaculty().getId())
                .facultyName(department.getFaculty().getName())
                .build();
    }

    private PublicBuildingResponse toBuildingResponse(Building building) {
        return PublicBuildingResponse.builder()
                .id(building.getId())
                .name(building.getName())
                .code(building.getCode())
                .facultyId(building.getFaculty().getId())
                .build();
    }

    private PublicFloorResponse toFloorResponse(Floor floor) {
        return PublicFloorResponse.builder()
                .id(floor.getId())
                .name(floor.getName())
                .level(floor.getLevel())
                .buildingId(floor.getBuilding().getId())
                .build();
    }

    private DailyScheduleEntry toDailyScheduleEntry(WeeklySchedule schedule) {
        TimeRange range = parseTimeRange(schedule.getTimeSlot());
        Course course = schedule.getCourse();
        Academician academician = course.getAcademician();
        UUID groupId = schedule.getScheduleGroupId() != null ? schedule.getScheduleGroupId() : schedule.getId();
        return new DailyScheduleEntry(
                groupId,
                "WEEKLY:" + groupId,
                "WEEKLY",
                null,
                course.getId(),
                course.getCode(),
                course.getName(),
                academician != null ? academician.getId() : null,
                academicianName(academician),
                range.start(),
                range.end()
        );
    }

    private DailyScheduleEntry toDailyScheduleEntry(ScheduleException exception) {
        List<TimeRange> slots = generateSlots(exception.getCourse().getDepartment().getId());
        TimeRange range = resolveExceptionRange(exception, slots);
        Course course = exception.getCourse();
        Academician academician = exception.getAcademician() != null ? exception.getAcademician() : course.getAcademician();
        return new DailyScheduleEntry(
                exception.getId(),
                "EXCEPTION:" + exception.getId(),
                "EXCEPTION",
                exception.getType().name(),
                course.getId(),
                course.getCode(),
                course.getName(),
                academician != null ? academician.getId() : null,
                academicianName(academician),
                range.start(),
                range.end()
        );
    }

    private List<PublicClassroomDailyScheduleItemResponse> mergeDailyScheduleEntries(List<DailyScheduleEntry> entries) {
        Map<String, List<DailyScheduleEntry>> entriesByGroup = entries.stream()
                .sorted(Comparator.comparing(DailyScheduleEntry::start))
                .collect(Collectors.groupingBy(DailyScheduleEntry::groupKey, LinkedHashMap::new, Collectors.toList()));

        return entriesByGroup.values().stream()
                .map(this::toDailyScheduleItem)
                .sorted(Comparator.comparing(PublicClassroomDailyScheduleItemResponse::startTime))
                .toList();
    }

    private PublicClassroomDailyScheduleItemResponse toDailyScheduleItem(List<DailyScheduleEntry> group) {
        DailyScheduleEntry first = group.stream()
                .min(Comparator.comparing(DailyScheduleEntry::start))
                .orElseThrow();
        LocalTime start = group.stream()
                .map(DailyScheduleEntry::start)
                .min(LocalTime::compareTo)
                .orElse(first.start());
        LocalTime end = group.stream()
                .map(DailyScheduleEntry::end)
                .max(LocalTime::compareTo)
                .orElse(first.end());
        String startTime = start.format(TIME_FORMATTER);
        String endTime = end.format(TIME_FORMATTER);
        return new PublicClassroomDailyScheduleItemResponse(
                first.id(),
                first.sourceType(),
                first.exceptionType(),
                first.courseId(),
                first.courseCode(),
                first.courseName(),
                first.academicianId(),
                first.academicianName(),
                startTime + "-" + endTime,
                startTime,
                endTime
        );
    }

    private String academicianName(Academician academician) {
        if (academician == null) {
            return null;
        }
        return List.of(academician.getTitle(), academician.getFirstName(), academician.getLastName())
                .stream()
                .filter(part -> part != null && !part.isBlank())
                .collect(Collectors.joining(" "));
    }

    private PublicSpaceObjectResponse toSpaceObjectResponse(SpaceObject spaceObject, Map<UUID, ClassroomStatusSnapshot> statuses) {
        PublicSpaceObjectResponse response = PublicSpaceObjectResponse.builder()
                .id(spaceObject.getId())
                .classroomId(spaceObject.getClassroom() != null ? spaceObject.getClassroom().getId() : null)
                .type(spaceObject.getType())
                .status(spaceObject.getStatus())
                .label(spaceObject.getLabel())
                .code(spaceObject.getCode())
                .capacity(spaceObject.getCapacity())
                .positionX(spaceObject.getPositionX())
                .positionY(spaceObject.getPositionY())
                .width(spaceObject.getWidth())
                .height(spaceObject.getHeight())
                .rotation(spaceObject.getRotation())
                .slotRow(spaceObject.getSlotRow())
                .slotColumn(spaceObject.getSlotColumn())
                .placed(true)
                .build();
        UUID classroomId = response.getClassroomId();
        applyStatus(response, classroomId != null ? statuses.get(classroomId) : ClassroomStatusSnapshot.available());
        return response;
    }

    private PublicSpaceObjectResponse toUnplacedClassroomResponse(Classroom classroom, Map<UUID, ClassroomStatusSnapshot> statuses) {
        PublicSpaceObjectResponse response = PublicSpaceObjectResponse.builder()
                .id(classroom.getId())
                .classroomId(classroom.getId())
                .type(toSpaceObjectType(classroom.getType()))
                .status(SpaceObjectStatus.EMPTY)
                .label(classroom.getName())
                .code(classroom.getCode())
                .capacity(classroom.getCapacity())
                .positionX(0.0)
                .positionY(0.0)
                .width(160.0)
                .height(100.0)
                .rotation(0.0)
                .placed(false)
                .build();
        applyStatus(response, statuses.get(classroom.getId()));
        return response;
    }

    private Map<UUID, ClassroomStatusSnapshot> resolveClassroomStatuses(UUID floorId) {
        LocalDate today = LocalDate.now(APPLICATION_ZONE);
        LocalTime now = LocalTime.now(APPLICATION_ZONE);
        String dayOfWeek = today.getDayOfWeek().name();

        Map<UUID, List<ClassroomEvent>> eventsByClassroom = new HashMap<>();
        Set<UUID> cancelledScheduleIds = scheduleExceptionRepository
                .findAllByOriginalDateAndOriginalSchedule_Classroom_Floor_Id(today, floorId)
                .stream()
                .filter(exception -> exception.getType() == ScheduleExceptionType.CANCELLED)
                .filter(exception -> exception.getOriginalSchedule() != null)
                .map(exception -> exception.getOriginalSchedule().getId())
                .collect(Collectors.toSet());

        weeklyScheduleRepository.findAllByClassroom_Floor_IdAndDayOfWeekOrderByTimeSlotAsc(floorId, dayOfWeek)
                .stream()
                .filter(schedule -> !cancelledScheduleIds.contains(schedule.getId()))
                .map(this::toClassroomEvent)
                .forEach(event -> eventsByClassroom.computeIfAbsent(event.classroomId(), id -> new ArrayList<>()).add(event));

        scheduleExceptionRepository.findAllByTargetDateAndClassroom_Floor_Id(today, floorId)
                .stream()
                .filter(exception -> exception.getType() != ScheduleExceptionType.CANCELLED)
                .filter(exception -> exception.getClassroom() != null)
                .filter(exception -> exception.getCourse() != null && exception.getCourse().getDepartment() != null)
                .map(this::toClassroomEvent)
                .forEach(event -> eventsByClassroom.computeIfAbsent(event.classroomId(), id -> new ArrayList<>()).add(event));

        Map<UUID, ClassroomStatusSnapshot> statuses = new HashMap<>();
        for (Map.Entry<UUID, List<ClassroomEvent>> entry : eventsByClassroom.entrySet()) {
            statuses.put(entry.getKey(), resolveStatus(entry.getValue(), now));
        }
        return statuses;
    }

    private ClassroomStatusSnapshot resolveStatus(List<ClassroomEvent> events, LocalTime now) {
        List<ClassroomEvent> sortedEvents = events.stream()
                .sorted(Comparator.comparing(ClassroomEvent::start))
                .toList();

        ClassroomEvent current = sortedEvents.stream()
                .filter(event -> !now.isBefore(event.start()) && now.isBefore(event.end()))
                .findFirst()
                .orElse(null);
        if (current != null) {
            return ClassroomStatusSnapshot.occupied(current);
        }

        ClassroomEvent next = sortedEvents.stream()
                .filter(event -> now.isBefore(event.start()))
                .findFirst()
                .orElse(null);
        if (next != null && Duration.between(now, next.start()).toMinutes() <= 30) {
            return ClassroomStatusSnapshot.startingSoon(next);
        }

        return ClassroomStatusSnapshot.available();
    }

    private ClassroomEvent toClassroomEvent(WeeklySchedule schedule) {
        TimeRange range = parseTimeRange(schedule.getTimeSlot());
        return new ClassroomEvent(
                schedule.getClassroom().getId(),
                schedule.getCourse().getName(),
                range.start(),
                range.end(),
                schedule.getTimeSlot()
        );
    }

    private ClassroomEvent toClassroomEvent(ScheduleException exception) {
        List<TimeRange> slots = generateSlots(exception.getCourse().getDepartment().getId());
        TimeRange range = resolveExceptionRange(exception, slots);
        return new ClassroomEvent(
                exception.getClassroom().getId(),
                exception.getCourse().getName(),
                range.start(),
                range.end(),
                range.start().format(TIME_FORMATTER) + "-" + range.end().format(TIME_FORMATTER)
        );
    }

    private TimeRange resolveExceptionRange(ScheduleException exception, List<TimeRange> slots) {
        TimeRange parsed = parseTimeRange(exception.getTimeSlot());
        int startIndex = slots.indexOf(parsed);
        if (startIndex < 0) {
            return parsed;
        }
        int endIndex = Math.min(slots.size() - 1, startIndex + Math.max(1, exception.getSlotCount()) - 1);
        return new TimeRange(slots.get(startIndex).start(), slots.get(endIndex).end());
    }

    private List<TimeRange> generateSlots(UUID departmentId) {
        var config = departmentScheduleConfigRepository.findByDepartmentId(departmentId).orElse(null);
        LocalTime start = parseTime(config != null ? config.getStartTime() : "08:15");
        LocalTime end = parseTime(config != null ? config.getEndTime() : "17:00");
        LocalTime lunchStart = parseTime(config != null ? config.getLunchBreakStart() : "12:40");
        LocalTime lunchEnd = parseTime(config != null ? config.getLunchBreakEnd() : "13:30");
        int lessonMinutes = config != null ? config.getLessonDurationMinutes() : 45;
        int breakMinutes = config != null ? config.getBreakDurationMinutes() : 10;
        boolean lunchEnabled = config == null || Boolean.TRUE.equals(config.getLunchBreakEnabled());

        List<TimeRange> slots = new ArrayList<>();
        LocalTime cursor = start;
        while (!cursor.plusMinutes(lessonMinutes).isAfter(end)) {
            LocalTime slotEnd = cursor.plusMinutes(lessonMinutes);
            if (lunchEnabled && overlaps(cursor, slotEnd, lunchStart, lunchEnd)) {
                cursor = lunchEnd;
                continue;
            }
            slots.add(new TimeRange(cursor, slotEnd));
            cursor = slotEnd.plusMinutes(breakMinutes);
        }
        return slots;
    }

    private boolean overlaps(LocalTime start, LocalTime end, LocalTime blockedStart, LocalTime blockedEnd) {
        return start.isBefore(blockedEnd) && end.isAfter(blockedStart);
    }

    private TimeRange parseTimeRange(String timeSlot) {
        String[] parts = timeSlot.trim().split("-");
        if (parts.length != 2) {
            throw new IllegalArgumentException("Gecersiz zaman blogu.");
        }
        return new TimeRange(parseTime(parts[0]), parseTime(parts[1]));
    }

    private LocalTime parseTime(String time) {
        try {
            return LocalTime.parse(time.trim(), TIME_FORMATTER);
        } catch (DateTimeParseException exception) {
            throw new IllegalArgumentException("Saat bilgisi HH:mm formatinda olmalidir.");
        }
    }

    private void applyStatus(PublicSpaceObjectResponse response, ClassroomStatusSnapshot snapshot) {
        ClassroomStatusSnapshot resolved = snapshot != null ? snapshot : ClassroomStatusSnapshot.available();
        response.setAvailabilityStatus(resolved.status());
        response.setAvailabilityLabel(resolved.label());
        response.setCurrentCourseName(resolved.currentCourseName());
        response.setCurrentTimeSlot(resolved.currentTimeSlot());
        response.setNextCourseName(resolved.nextCourseName());
        response.setNextStartTime(resolved.nextStartTime());
    }

    private boolean isTeachingSpace(SpaceObjectType type) {
        return type == SpaceObjectType.CLASSROOM
                || type == SpaceObjectType.LABORATORY
                || type == SpaceObjectType.AMPHITHEATER;
    }

    private SpaceObjectType toSpaceObjectType(ClassroomType type) {
        return switch (type) {
            case CLASSROOM -> SpaceObjectType.CLASSROOM;
            case LABORATORY -> SpaceObjectType.LABORATORY;
            case AMPHITHEATER -> SpaceObjectType.AMPHITHEATER;
        };
    }

    private record DailyScheduleEntry(
            UUID id,
            String groupKey,
            String sourceType,
            String exceptionType,
            UUID courseId,
            String courseCode,
            String courseName,
            UUID academicianId,
            String academicianName,
            LocalTime start,
            LocalTime end
    ) {
    }

    private record TimeRange(LocalTime start, LocalTime end) {
    }

    private record ClassroomEvent(UUID classroomId, String courseName, LocalTime start, LocalTime end, String timeSlot) {
    }

    private record ClassroomStatusSnapshot(
            ClassroomAvailabilityStatus status,
            String label,
            String currentCourseName,
            String currentTimeSlot,
            String nextCourseName,
            String nextStartTime
    ) {
        private static ClassroomStatusSnapshot available() {
            return new ClassroomStatusSnapshot(ClassroomAvailabilityStatus.AVAILABLE, "Bos", null, null, null, null);
        }

        private static ClassroomStatusSnapshot occupied(ClassroomEvent event) {
            return new ClassroomStatusSnapshot(ClassroomAvailabilityStatus.OCCUPIED, "Dolu", event.courseName(), event.timeSlot(), null, null);
        }

        private static ClassroomStatusSnapshot startingSoon(ClassroomEvent event) {
            return new ClassroomStatusSnapshot(ClassroomAvailabilityStatus.STARTING_SOON, "Yakinda dolacak", null, null, event.courseName(), event.start().format(TIME_FORMATTER));
        }
    }
}
