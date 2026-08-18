package com.dts.dersliktakip.service;

import com.dts.dersliktakip.dto.AcademicPeriodResponse;
import com.dts.dersliktakip.dto.CreateAcademicPeriodRequest;
import com.dts.dersliktakip.dto.UpdateAcademicPeriodRequest;
import com.dts.dersliktakip.entity.AcademicPeriod;
import com.dts.dersliktakip.entity.TermType;
import com.dts.dersliktakip.repository.AcademicPeriodRepository;
import com.dts.dersliktakip.repository.CourseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AcademicPeriodService {

    private final AcademicPeriodRepository academicPeriodRepository;
    private final CourseRepository courseRepository;

    @Transactional(readOnly = true)
    public List<AcademicPeriodResponse> getAllPeriods(Integer limit) {
        List<AcademicPeriod> periods;
        Sort sort = Sort.by(Sort.Direction.DESC, "startDate");
        if (limit != null && limit > 0) {
            periods = academicPeriodRepository.findAll(PageRequest.of(0, limit, sort)).getContent();
        } else {
            periods = academicPeriodRepository.findAll(sort);
        }
        return periods.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public AcademicPeriodResponse getActivePeriod() {
        AcademicPeriod activePeriod = academicPeriodRepository.findByIsActiveTrue()
                .orElseThrow(() -> new IllegalArgumentException("Aktif akademik dönem bulunamadı."));
        return toResponse(activePeriod);
    }

    @Transactional
    public AcademicPeriodResponse createPeriod(CreateAcademicPeriodRequest request) {
        validateAcademicYearFormat(request.academicYear());
        validateDates(request.startDate(), request.endDate());

        if (academicPeriodRepository.existsByAcademicYearAndTermType(request.academicYear(), request.termType())) {
            throw new IllegalArgumentException("Bu akademik yıl ve dönem tipi için zaten bir kayıt mevcut: " 
                    + request.academicYear() + " " + getTermLabel(request.termType()));
        }

        AcademicPeriod period = new AcademicPeriod();
        period.setAcademicYear(request.academicYear());
        period.setTermType(request.termType());
        period.setDisplayName(request.academicYear() + " " + getTermLabel(request.termType()));
        period.setStartDate(request.startDate());
        period.setEndDate(request.endDate());
        period.setActive(request.isActive());

        if (request.isActive()) {
            deactivateAllOtherPeriods();
        } else {
            // If it is the very first period, force it to be active
            if (academicPeriodRepository.count() == 0) {
                period.setActive(true);
            }
        }

        AcademicPeriod saved = academicPeriodRepository.save(period);
        return toResponse(saved);
    }

    @Transactional
    public AcademicPeriodResponse updatePeriod(UUID id, UpdateAcademicPeriodRequest request) {
        AcademicPeriod period = academicPeriodRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Dönem bulunamadı."));

        validateAcademicYearFormat(request.academicYear());
        validateDates(request.startDate(), request.endDate());

        if (academicPeriodRepository.existsByAcademicYearAndTermTypeAndIdNot(request.academicYear(), request.termType(), id)) {
            throw new IllegalArgumentException("Bu akademik yıl ve dönem tipi için zaten başka bir kayıt mevcut: " 
                    + request.academicYear() + " " + getTermLabel(request.termType()));
        }

        // If currently active and request sets to inactive, verify if we have another active period
        if (period.isActive() && !request.isActive()) {
            long activeCount = academicPeriodRepository.findAll().stream().filter(p -> p.isActive() && !p.getId().equals(id)).count();
            if (activeCount == 0) {
                throw new IllegalArgumentException("En az bir dönem aktif olmak zorundadır. Lütfen başka bir dönemi aktif yapınız.");
            }
        }

        period.setAcademicYear(request.academicYear());
        period.setTermType(request.termType());
        period.setDisplayName(request.academicYear() + " " + getTermLabel(request.termType()));
        period.setStartDate(request.startDate());
        period.setEndDate(request.endDate());
        period.setActive(request.isActive());

        if (request.isActive()) {
            deactivateAllOtherPeriodsExcept(id);
        }

        AcademicPeriod saved = academicPeriodRepository.save(period);
        return toResponse(saved);
    }

    @Transactional
    public void activatePeriod(UUID id) {
        AcademicPeriod period = academicPeriodRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Dönem bulunamadı."));

        if (period.isActive()) {
            return;
        }

        deactivateAllOtherPeriods();
        period.setActive(true);
        academicPeriodRepository.save(period);
    }

    @Transactional
    public void deletePeriod(UUID id) {
        AcademicPeriod period = academicPeriodRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Dönem bulunamadı."));

        if (period.isActive()) {
            throw new IllegalArgumentException("Aktif dönem silinemez.");
        }

        // Check if there are courses referencing this period
        // Wait, courseRepository will have existsByAcademicPeriodId. We will add it next.
        // But for safety let's write checking logic.
        if (courseRepository.existsByAcademicPeriodId(id)) {
            // Keep past courses/schedules safe, use archiving/inactive rule.
            throw new IllegalArgumentException("Bu döneme bağlı ders veya ders programı kayıtları bulunduğundan silinemez.");
        }

        academicPeriodRepository.delete(period);
    }

    private void deactivateAllOtherPeriods() {
        List<AcademicPeriod> activePeriods = academicPeriodRepository.findAll().stream()
                .filter(AcademicPeriod::isActive)
                .toList();
        for (AcademicPeriod active : activePeriods) {
            active.setActive(false);
        }
        academicPeriodRepository.saveAll(activePeriods);
    }

    private void deactivateAllOtherPeriodsExcept(UUID exceptId) {
        List<AcademicPeriod> activePeriods = academicPeriodRepository.findAll().stream()
                .filter(p -> p.isActive() && !p.getId().equals(exceptId))
                .toList();
        for (AcademicPeriod active : activePeriods) {
            active.setActive(false);
        }
        academicPeriodRepository.saveAll(activePeriods);
    }

    private void validateAcademicYearFormat(String academicYear) {
        if (academicYear == null || !academicYear.matches("^\\d{4}-\\d{4}$")) {
            throw new IllegalArgumentException("Akademik yıl formatı YYYY-YYYY olmalıdır (Örn: 2026-2027).");
        }
        String[] years = academicYear.split("-");
        int y1 = Integer.parseInt(years[0]);
        int y2 = Integer.parseInt(years[1]);
        if (y2 != y1 + 1) {
            throw new IllegalArgumentException("Akademik yılın ikinci yılı, ilk yılından tam 1 yıl sonra olmalıdır (Örn: 2026-2027).");
        }
    }

    private void validateDates(java.time.LocalDate start, java.time.LocalDate end) {
        if (start == null || end == null) {
            throw new IllegalArgumentException("Başlangıç ve bitiş tarihleri boş olamaz.");
        }
        if (!start.isBefore(end)) {
            throw new IllegalArgumentException("Başlangıç tarihi bitiş tarihinden önce olmalıdır.");
        }
    }

    private String getTermLabel(TermType type) {
        return type == TermType.FALL ? "Güz" : "Bahar";
    }

    public AcademicPeriodResponse toResponse(AcademicPeriod period) {
        return new AcademicPeriodResponse(
                period.getId(),
                period.getAcademicYear(),
                period.getTermType(),
                period.getDisplayName(),
                period.getStartDate(),
                period.getEndDate(),
                period.isActive()
        );
    }
}
