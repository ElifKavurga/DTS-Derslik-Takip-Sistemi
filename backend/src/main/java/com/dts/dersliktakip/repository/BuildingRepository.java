package com.dts.dersliktakip.repository;

import com.dts.dersliktakip.entity.Building;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface BuildingRepository extends JpaRepository<Building, UUID> {
    List<Building> findTop5ByOrderByCreatedAtDesc();
}
