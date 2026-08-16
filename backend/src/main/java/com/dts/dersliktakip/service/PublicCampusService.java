package com.dts.dersliktakip.service;

import com.dts.dersliktakip.dto.PublicBuildingResponse;
import com.dts.dersliktakip.dto.PublicFacultyResponse;
import com.dts.dersliktakip.entity.Building;
import com.dts.dersliktakip.entity.Faculty;
import com.dts.dersliktakip.exception.ResourceNotFoundException;
import com.dts.dersliktakip.repository.BuildingRepository;
import com.dts.dersliktakip.repository.FacultyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PublicCampusService {

    private final FacultyRepository facultyRepository;
    private final BuildingRepository buildingRepository;

    @Transactional(readOnly = true)
    public List<PublicFacultyResponse> getFaculties() {
        return facultyRepository.findAllByOrderByNameAsc().stream()
                .map(this::toFacultyResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PublicBuildingResponse> getBuildingsByFacultyId(UUID facultyId) {
        if (!facultyRepository.existsById(facultyId)) {
            throw new ResourceNotFoundException("Fakülte bulunamadı.");
        }

        return buildingRepository.findAllByFacultyIdOrderByNameAsc(facultyId).stream()
                .map(this::toBuildingResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public PublicBuildingResponse getBuildingByFacultyId(UUID facultyId, UUID buildingId) {
        if (!facultyRepository.existsById(facultyId)) {
            throw new ResourceNotFoundException("Fakülte bulunamadı.");
        }

        Building building = buildingRepository.findByIdAndFacultyId(buildingId, facultyId)
                .orElseThrow(() -> new ResourceNotFoundException("Bina bulunamadı."));
        return toBuildingResponse(building);
    }

    private PublicFacultyResponse toFacultyResponse(Faculty faculty) {
        return PublicFacultyResponse.builder()
                .id(faculty.getId())
                .name(faculty.getName())
                .code(faculty.getCode())
                .build();
    }

    private PublicBuildingResponse toBuildingResponse(Building building) {
        return PublicBuildingResponse.builder()
                .id(building.getId())
                .name(building.getName())
                .code(building.getCode())
                .facultyId(building.getFaculty().getId())
                .build();
    }
}
