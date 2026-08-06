package com.dts.dersliktakip.repository;

import com.dts.dersliktakip.entity.FloorLayout;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface FloorLayoutRepository extends JpaRepository<FloorLayout, UUID> {
    Optional<FloorLayout> findByFloorId(UUID floorId);
    boolean existsByFloorId(UUID floorId);
    void deleteByFloorId(UUID floorId);
}
