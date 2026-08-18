package com.dts.dersliktakip.repository;

import com.dts.dersliktakip.entity.AcademicPeriod;
import com.dts.dersliktakip.entity.TermType;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface AcademicPeriodRepository extends JpaRepository<AcademicPeriod, UUID> {
    Optional<AcademicPeriod> findByIsActiveTrue();

    boolean existsByAcademicYearAndTermType(String academicYear, TermType termType);

    boolean existsByAcademicYearAndTermTypeAndIdNot(String academicYear, TermType termType, UUID id);
}
