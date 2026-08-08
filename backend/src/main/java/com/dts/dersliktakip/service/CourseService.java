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

    @Transactional(readOnly = true)
    public CourseListResponse getAllCourses(User currentUser) {
        List<Course> visibleCourses = accessScopeService.isSuperAdmin(currentUser)
                ? courseRepository.findAll()
                : courseRepository.findAllByDepartmentId(accessScopeService.requireDepartmentScope(currentUser).getId());

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
        accessScopeService.assertFacultyAccess(currentUser, request.facultyId());
        accessScopeService.assertDepartmentAccess(currentUser, request.departmentId());

        if (courseRepository.existsByCode(request.code())) {
            throw new IllegalArgumentException("Bu ders kodu zaten kullanılıyor");
        }

        Faculty faculty = facultyRepository.findById(request.facultyId())
                .orElseThrow(() -> new IllegalArgumentException("Fakülte bulunamadı"));
        Department department = departmentRepository.findById(request.departmentId())
                .orElseThrow(() -> new IllegalArgumentException("Bölüm bulunamadı"));
        Academician academician = academicianRepository.findById(request.academicianId())
                .orElseThrow(() -> new IllegalArgumentException("Akademisyen bulunamadı"));

        if (!department.getFaculty().getId().equals(faculty.getId())) {
            throw new IllegalArgumentException("Seçilen bölüm bu fakülteye ait değil");
        }
        if (!academician.getDepartment().getId().equals(department.getId())) {
            throw new IllegalArgumentException("Seçilen akademisyen bu bölüme ait değil");
        }

        Course course = new Course();
        course.setCode(request.code());
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
    public CourseResponse updateCourse(UUID id, UpdateCourseRequest request, User currentUser) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Ders bulunamadı"));
        assertCourseAccess(currentUser, course);
        accessScopeService.assertFacultyAccess(currentUser, request.facultyId());
        accessScopeService.assertDepartmentAccess(currentUser, request.departmentId());

        if (courseRepository.existsByCodeAndIdNot(request.code(), id)) {
            throw new IllegalArgumentException("Bu ders kodu başka bir ders tarafından kullanılıyor");
        }

        Faculty faculty = facultyRepository.findById(request.facultyId())
                .orElseThrow(() -> new IllegalArgumentException("Fakülte bulunamadı"));
        Department department = departmentRepository.findById(request.departmentId())
                .orElseThrow(() -> new IllegalArgumentException("Bölüm bulunamadı"));
        Academician academician = academicianRepository.findById(request.academicianId())
                .orElseThrow(() -> new IllegalArgumentException("Akademisyen bulunamadı"));

        if (!department.getFaculty().getId().equals(faculty.getId())) {
            throw new IllegalArgumentException("Seçilen bölüm bu fakülteye ait değil");
        }
        if (!academician.getDepartment().getId().equals(department.getId())) {
            throw new IllegalArgumentException("Seçilen akademisyen bu bölüme ait değil");
        }

        course.setCode(request.code());
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

    private void assertCourseAccess(User currentUser, Course course) {
        if (accessScopeService.isSuperAdmin(currentUser)) {
            return;
        }
        Department scopedDepartment = accessScopeService.requireDepartmentScope(currentUser);
        if (course.getDepartment() == null || !course.getDepartment().getId().equals(scopedDepartment.getId())) {
            throw new AccessDeniedException("Bu ders icin yetkiniz yok.");
        }
    }
}
