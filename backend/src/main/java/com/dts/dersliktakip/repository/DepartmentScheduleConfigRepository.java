package com.dts.dersliktakip.repository;

import com.dts.dersliktakip.entity.DepartmentScheduleConfig;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface DepartmentScheduleConfigRepository extends JpaRepository<DepartmentScheduleConfig, UUID> {

    Optional<DepartmentScheduleConfig> findByDepartmentId(UUID departmentId);
}
