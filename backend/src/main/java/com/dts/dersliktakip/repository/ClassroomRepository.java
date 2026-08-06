package com.dts.dersliktakip.repository;

import com.dts.dersliktakip.entity.Classroom;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface ClassroomRepository extends JpaRepository<Classroom, UUID> {
    long countByFloorBuildingFacultyId(UUID facultyId);

    long countByFloorBuildingId(UUID buildingId);

    boolean existsByFloorId(UUID floorId);

    long countByFloorId(UUID floorId);
}
