package com.dts.dersliktakip.repository;

import com.dts.dersliktakip.entity.Course;
import com.dts.dersliktakip.entity.Semester;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CourseRepository extends JpaRepository<Course, UUID> {
    
    @EntityGraph(attributePaths = {"faculty", "department", "academician"})
    List<Course> findAll();

    @EntityGraph(attributePaths = {"faculty", "department", "academician"})
    List<Course> findAllByDepartmentId(UUID departmentId);

    @EntityGraph(attributePaths = {"faculty", "department", "academician"})
    List<Course> findAllByDepartmentIdAndSemester(UUID departmentId, Semester semester);

    @EntityGraph(attributePaths = {"faculty", "department", "academician"})
    List<Course> findAllByAcademicianId(UUID academicianId);

    @EntityGraph(attributePaths = {"faculty", "department", "academician"})
    List<Course> findAllByAcademicianIdAndSemester(UUID academicianId, Semester semester);

    long countByDepartment_Id(UUID departmentId);

    boolean existsByDepartment_Id(UUID departmentId);
    
    boolean existsByCodeIgnoreCase(String code);
    
    boolean existsByCodeIgnoreCaseAndIdNot(String code, UUID id);
}
