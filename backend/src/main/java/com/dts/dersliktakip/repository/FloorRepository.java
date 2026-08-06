package com.dts.dersliktakip.repository;

import com.dts.dersliktakip.entity.Floor;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;
import java.util.List;

public interface FloorRepository extends JpaRepository<Floor, UUID> {
    long countByBuildingFacultyId(UUID facultyId);

    boolean existsByBuildingId(UUID buildingId);

    long countByBuildingId(UUID buildingId);

    List<Floor> findAllByBuildingIdOrderByLevelAsc(UUID buildingId);

    boolean existsByLevelAndBuildingId(Integer level, UUID buildingId);

    boolean existsByLevelAndBuildingIdAndIdNot(Integer level, UUID buildingId, UUID floorId);
}
