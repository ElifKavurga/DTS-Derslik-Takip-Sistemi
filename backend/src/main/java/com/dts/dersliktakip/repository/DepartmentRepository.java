package com.dts.dersliktakip.repository;

import com.dts.dersliktakip.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface DepartmentRepository extends JpaRepository<Department, UUID> {
    boolean existsByFacultyId(UUID facultyId);
    List<Department> findByFacultyId(UUID facultyId);
    boolean existsByFaculty_IdAndCodeIgnoreCase(UUID facultyId, String code);
    boolean existsByFaculty_IdAndCodeIgnoreCaseAndIdNot(UUID facultyId, String code, UUID id);
    boolean existsByFaculty_IdAndNameIgnoreCase(UUID facultyId, String name);
    boolean existsByFaculty_IdAndNameIgnoreCaseAndIdNot(UUID facultyId, String name, UUID id);
}
