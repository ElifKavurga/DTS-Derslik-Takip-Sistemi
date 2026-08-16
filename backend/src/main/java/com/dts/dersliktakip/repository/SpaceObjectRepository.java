package com.dts.dersliktakip.repository;

import com.dts.dersliktakip.entity.SpaceObject;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SpaceObjectRepository extends JpaRepository<SpaceObject, UUID> {
    List<SpaceObject> findAllByFloorId(UUID floorId);
    List<SpaceObject> findAllByFloorIdOrderBySlotRowAscSlotColumnAscPositionYAscPositionXAsc(UUID floorId);
    void deleteAllByFloorId(UUID floorId);
    void deleteAllByFloorIdAndClassroomId(UUID floorId, UUID classroomId);
    boolean existsByFloorIdAndClassroomId(UUID floorId, UUID classroomId);
}
