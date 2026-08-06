package com.dts.dersliktakip.repository;

import com.dts.dersliktakip.entity.Building;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface BuildingRepository extends JpaRepository<Building, UUID> {
    List<Building> findTop5ByOrderByCreatedAtDesc();

    boolean existsByFacultyId(UUID facultyId);

    long countByFacultyId(UUID facultyId);

    List<Building> findAllByFacultyId(UUID facultyId);

    boolean existsByNameAndFacultyId(String name, UUID facultyId);

    boolean existsByNameAndFacultyIdAndIdNot(String name, UUID facultyId, UUID buildingId);

    boolean existsByCodeAndFacultyId(String code, UUID facultyId);

    boolean existsByCodeAndFacultyIdAndIdNot(String code, UUID facultyId, UUID buildingId);
}
