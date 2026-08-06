package com.dts.dersliktakip.repository;

import com.dts.dersliktakip.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface DepartmentRepository extends JpaRepository<Department, UUID> {
    boolean existsByFacultyId(UUID facultyId);
}
