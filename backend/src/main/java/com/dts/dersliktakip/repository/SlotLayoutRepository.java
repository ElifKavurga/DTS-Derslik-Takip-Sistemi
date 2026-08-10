package com.dts.dersliktakip.repository;

import com.dts.dersliktakip.entity.SlotLayout;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface SlotLayoutRepository extends JpaRepository<SlotLayout, UUID> {
    Optional<SlotLayout> findByFloorId(UUID floorId);
    boolean existsByFloorId(UUID floorId);
}
