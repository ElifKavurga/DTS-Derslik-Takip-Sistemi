package com.dts.dersliktakip.repository;

import com.dts.dersliktakip.entity.Academician;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AcademicianRepository extends JpaRepository<Academician, UUID> {
    List<Academician> findByDepartmentId(UUID departmentId);

    Optional<Academician> findByEmail(String email);
}
