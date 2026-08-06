package com.dts.dersliktakip.repository;

import com.dts.dersliktakip.entity.Floor;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface FloorRepository extends JpaRepository<Floor, UUID> {
    long countByBuildingFacultyId(UUID facultyId);
}
