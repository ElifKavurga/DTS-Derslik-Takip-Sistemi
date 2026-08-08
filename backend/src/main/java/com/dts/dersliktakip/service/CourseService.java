package com.dts.dersliktakip.service;

import com.dts.dersliktakip.dto.CourseListResponse;
import com.dts.dersliktakip.dto.CourseResponse;
import com.dts.dersliktakip.dto.CreateCourseRequest;
import com.dts.dersliktakip.dto.UpdateCourseRequest;
import com.dts.dersliktakip.entity.Academician;
import com.dts.dersliktakip.entity.Course;
import com.dts.dersliktakip.entity.Department;
import com.dts.dersliktakip.entity.Faculty;
import com.dts.dersliktakip.mapper.CourseMapper;
import com.dts.dersliktakip.repository.AcademicianRepository;
import com.dts.dersliktakip.repository.CourseRepository;
import com.dts.dersliktakip.repository.DepartmentRepository;
import com.dts.dersliktakip.repository.FacultyRepository;
import lombok.RequiredArgsConstructor;
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

    @Transactional(readOnly = true)
    public CourseListResponse getAllCourses() {
        List<CourseResponse> courses = courseRepository.findAll().stream()
                .map(courseMapper::toResponse)
                .collect(Collectors.toList());
        return new CourseListResponse(courses);
    }

    @Transactional(readOnly = true)
    public CourseResponse getCourseById(UUID id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Ders bulunamadı"));
        return courseMapper.toResponse(course);
    }

    @Transactional
    public CourseResponse createCourse(CreateCourseRequest request) {
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
    public CourseResponse updateCourse(UUID id, UpdateCourseRequest request) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Ders bulunamadı"));

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
    public void deleteCourse(UUID id) {
        if (!courseRepository.existsById(id)) {
            throw new IllegalArgumentException("Ders bulunamadı");
        }
        courseRepository.deleteById(id);
    }
}
