package com.dts.dersliktakip.repository;

import com.dts.dersliktakip.entity.Faculty;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface FacultyRepository extends JpaRepository<Faculty, UUID> {
    List<Faculty> findTop5ByOrderByCreatedAtDesc();
}
