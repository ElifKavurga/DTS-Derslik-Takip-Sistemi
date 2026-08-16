package com.dts.dersliktakip.repository;

import com.dts.dersliktakip.entity.Faculty;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface FacultyRepository extends JpaRepository<Faculty, UUID> {
    List<Faculty> findAllByOrderByNameAsc();

    List<Faculty> findTop5ByOrderByCreatedAtDesc();

    boolean existsByName(String name);

    boolean existsByNameAndIdNot(String name, UUID id);

    boolean existsByCode(String code);

    boolean existsByCodeAndIdNot(String code, UUID id);
}
