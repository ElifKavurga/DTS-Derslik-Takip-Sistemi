package com.dts.dersliktakip.repository;

import com.dts.dersliktakip.entity.Course;
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
    
    boolean existsByCode(String code);
    
    boolean existsByCodeAndIdNot(String code, UUID id);
}
