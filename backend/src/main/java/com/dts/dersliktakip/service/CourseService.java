package com.dts.dersliktakip.service;

import com.dts.dersliktakip.dto.CourseListResponse;
import com.dts.dersliktakip.dto.CourseResponse;
import com.dts.dersliktakip.dto.CreateCourseRequest;
import com.dts.dersliktakip.dto.UpdateCourseRequest;
import com.dts.dersliktakip.entity.Academician;
import com.dts.dersliktakip.entity.Course;
import com.dts.dersliktakip.entity.Department;
import com.dts.dersliktakip.entity.Faculty;
import com.dts.dersliktakip.entity.User;
import com.dts.dersliktakip.entity.Role;
import com.dts.dersliktakip.mapper.CourseMapper;
import com.dts.dersliktakip.repository.AcademicianRepository;
import com.dts.dersliktakip.repository.CourseRepository;
import com.dts.dersliktakip.repository.DepartmentRepository;
import com.dts.dersliktakip.repository.FacultyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CourseService {

    private final CourseRepository courseRepository;
    private final FacultyRepository facultyRepository;
    private final DepartmentRepository departmentRepository;
    private final AcademicianRepository academicianRepository;
    private final CourseMapper courseMapper;
    private final AccessScopeService accessScopeService;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public CourseListResponse getAllCourses(User currentUser) {
        List<Course> visibleCourses;
        if (accessScopeService.isSuperAdmin(currentUser)) {
            visibleCourses = courseRepository.findAll();
        } else if (currentUser.getRoles() != null && currentUser.getRoles().contains(Role.ACADEMICIAN)) {
            Academician academician = academicianRepository.findByEmail(currentUser.getEmail())
                    .orElseThrow(() -> new AccessDeniedException("Akademisyen kaydı bulunamadı."));
            visibleCourses = courseRepository.findAllByAcademicianId(academician.getId());
        } else {
            visibleCourses = courseRepository.findAllByDepartmentId(accessScopeService.requireDepartmentScope(currentUser).getId());
        }

        List<CourseResponse> courses = visibleCourses.stream()
                .map(courseMapper::toResponse)
                .collect(Collectors.toList());
        return new CourseListResponse(courses);
    }

    @Transactional(readOnly = true)
    public CourseResponse getCourseById(UUID id, User currentUser) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Ders bulunamadı"));
        assertCourseAccess(currentUser, course);
        return courseMapper.toResponse(course);
    }

    @Transactional
    public CourseResponse createCourse(CreateCourseRequest request, User currentUser) {
        String normalizedCode = normalizeCourseCode(request.code());
        Department department = resolveWritableDepartment(request.facultyId(), request.departmentId(), currentUser);
        Faculty faculty = department.getFaculty();

        if (courseRepository.existsByCodeIgnoreCase(normalizedCode)) {
            throw new IllegalArgumentException("Bu ders kodu zaten kullanılıyor");
        }

        Academician academician = academicianRepository.findById(request.academicianId())
                .orElseThrow(() -> new IllegalArgumentException("Akademisyen bulunamadı"));

        if (!academician.getDepartment().getId().equals(department.getId())) {
            throw new IllegalArgumentException("Seçilen akademisyen bu bölüme ait değil");
        }

        Course course = new Course();
        course.setCode(normalizedCode);
        course.setName(request.name());
        course.setFaculty(faculty);
        course.setDepartment(department);
        course.setAcademician(academician);
        course.setTheoreticalHours(request.theoreticalHours());
        course.setPracticalHours(request.practicalHours());
        course.setEcts(request.ects());
        course.setCredits(request.credits());
        course.setCourseType(request.courseType());
        course.setSemester(request.semester());
        course.setGrade(request.grade());
        course.setActive(request.active());

        course = courseRepository.save(course);
        notificationService.createForUser(
                currentUser,
                "Yeni ders oluşturuldu",
                course.getCode() + " - " + course.getName() + " sisteme eklendi.",
                accessScopeService.isSuperAdmin(currentUser) ? "/super-admin/dersler" : "/department-admin/dersler"
        );
        return courseMapper.toResponse(course);
    }

    @Transactional
    public CourseResponse updateCourse(UUID id, UpdateCourseRequest request, User currentUser) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Ders bulunamadı"));
        assertCourseAccess(currentUser, course);
        String normalizedCode = normalizeCourseCode(request.code());
        Department department = resolveWritableDepartment(request.facultyId(), request.departmentId(), currentUser);
        Faculty faculty = department.getFaculty();

        if (courseRepository.existsByCodeIgnoreCaseAndIdNot(normalizedCode, id)) {
            throw new IllegalArgumentException("Bu ders kodu başka bir ders tarafından kullanılıyor");
        }

        Academician academician = academicianRepository.findById(request.academicianId())
                .orElseThrow(() -> new IllegalArgumentException("Akademisyen bulunamadı"));

        if (!academician.getDepartment().getId().equals(department.getId())) {
            throw new IllegalArgumentException("Seçilen akademisyen bu bölüme ait değil");
        }

        course.setCode(normalizedCode);
        course.setName(request.name());
        course.setFaculty(faculty);
        course.setDepartment(department);
        course.setAcademician(academician);
        course.setTheoreticalHours(request.theoreticalHours());
        course.setPracticalHours(request.practicalHours());
        course.setEcts(request.ects());
        course.setCredits(request.credits());
        course.setCourseType(request.courseType());
        course.setSemester(request.semester());
        course.setGrade(request.grade());
        course.setActive(request.active());

        course = courseRepository.save(course);
        return courseMapper.toResponse(course);
    }

    @Transactional
    public void deleteCourse(UUID id, User currentUser) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Ders bulunamadı"));
        assertCourseAccess(currentUser, course);
        try {
            courseRepository.delete(course);
        } catch (DataIntegrityViolationException exception) {
            throw new IllegalArgumentException("Bu ders ilişkili kayıtlar bulunduğundan silinemez.");
        }
    }

    private Department resolveWritableDepartment(UUID facultyId, UUID departmentId, User currentUser) {
        if (!accessScopeService.isSuperAdmin(currentUser)) {
            return accessScopeService.requireDepartmentScope(currentUser);
        }

        if (facultyId == null) {
            throw new IllegalArgumentException("Fakülte seçimi zorunludur.");
        }
        if (departmentId == null) {
            throw new IllegalArgumentException("Bölüm seçimi zorunludur.");
        }

        Faculty faculty = facultyRepository.findById(facultyId)
                .orElseThrow(() -> new IllegalArgumentException("Fakülte bulunamadı"));
        Department department = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new IllegalArgumentException("Bölüm bulunamadı"));

        if (!department.getFaculty().getId().equals(faculty.getId())) {
            throw new IllegalArgumentException("Seçilen bölüm bu fakülteye ait değil");
        }
        return department;
    }

    private String normalizeCourseCode(String code) {
        return code.trim().toUpperCase(Locale.ROOT);
    }

    private void assertCourseAccess(User currentUser, Course course) {
        if (accessScopeService.isSuperAdmin(currentUser)) {
            return;
        }
        if (currentUser.getRoles() != null && currentUser.getRoles().contains(Role.ACADEMICIAN)) {
            Academician academician = academicianRepository.findByEmail(currentUser.getEmail())
                    .orElseThrow(() -> new AccessDeniedException("Akademisyen kaydı bulunamadı."));
            if (course.getAcademician() == null || !course.getAcademician().getId().equals(academician.getId())) {
                throw new AccessDeniedException("Bu ders icin yetkiniz yok.");
            }
            return;
        }
        Department scopedDepartment = accessScopeService.requireDepartmentScope(currentUser);
        if (course.getDepartment() == null || !course.getDepartment().getId().equals(scopedDepartment.getId())) {
            throw new AccessDeniedException("Bu ders icin yetkiniz yok.");
        }
    }
}
