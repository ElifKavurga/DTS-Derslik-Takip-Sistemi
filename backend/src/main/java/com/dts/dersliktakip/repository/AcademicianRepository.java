package com.dts.dersliktakip.repository;

import com.dts.dersliktakip.entity.Academician;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AcademicianRepository extends JpaRepository<Academician, UUID> {
    @Override
    @EntityGraph(attributePaths = {"faculty", "department"})
    List<Academician> findAll();

    @EntityGraph(attributePaths = {"faculty", "department"})
    List<Academician> findByDepartmentId(UUID departmentId);

    Optional<Academician> findByEmail(String email);

    long countByDepartment_Id(UUID departmentId);

    boolean existsByDepartment_Id(UUID departmentId);
}
