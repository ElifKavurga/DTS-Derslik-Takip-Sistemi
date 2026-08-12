package com.dts.dersliktakip.service;

import com.dts.dersliktakip.dto.BuildingDetailResponse;
import com.dts.dersliktakip.dto.CreateBuildingRequest;
import com.dts.dersliktakip.dto.BuildingResponse;
import com.dts.dersliktakip.dto.UpdateBuildingRequest;
import com.dts.dersliktakip.entity.Building;
import com.dts.dersliktakip.entity.Faculty;
import com.dts.dersliktakip.entity.User;
import com.dts.dersliktakip.exception.ResourceNotFoundException;
import com.dts.dersliktakip.mapper.BuildingMapper;
import com.dts.dersliktakip.repository.BuildingRepository;
import com.dts.dersliktakip.repository.ClassroomRepository;
import com.dts.dersliktakip.repository.FacultyRepository;
import com.dts.dersliktakip.repository.FloorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BuildingService {

    private final BuildingRepository buildingRepository;
    private final FacultyRepository facultyRepository;
    private final FloorRepository floorRepository;
    private final ClassroomRepository classroomRepository;
    private final BuildingMapper buildingMapper;
    private final AccessScopeService accessScopeService;

    @Transactional(readOnly = true)
    public BuildingDetailResponse getBuildingDetailById(UUID buildingId, User currentUser) {
        Building building = buildingRepository.findById(buildingId)
                .orElseThrow(() -> new ResourceNotFoundException("Bina bulunamadı."));

        accessScopeService.assertFacultyAccess(currentUser, building.getFaculty().getId());

        return BuildingDetailResponse.builder()
                .id(building.getId())
                .name(building.getName())
                .code(building.getCode())
                .facultyId(building.getFaculty().getId())
                .facultyName(building.getFaculty().getName())
                .totalFloors(floorRepository.countByBuildingId(buildingId))
                .totalClassrooms(classroomRepository.countByFloorBuildingId(buildingId))
                .build();
    }

    @Transactional(readOnly = true)
    public List<BuildingResponse> getBuildingsByFacultyId(UUID facultyId, User currentUser) {
        accessScopeService.assertFacultyAccess(currentUser, facultyId);

        if (!facultyRepository.existsById(facultyId)) {
            throw new ResourceNotFoundException("Fakülte bulunamadı.");
        }
        List<Building> buildings = buildingRepository.findAllByFacultyId(facultyId);
        return buildings.stream()
                .map(buildingMapper::toResponse)
                .map(this::enrichResponse)
                .toList();
    }

    @Transactional
    public BuildingResponse createBuilding(UUID facultyId, CreateBuildingRequest request) {
        Faculty faculty = facultyRepository.findById(facultyId)
                .orElseThrow(() -> new ResourceNotFoundException("Fakülte bulunamadı."));

        if (buildingRepository.existsByNameAndFacultyId(request.getName(), facultyId)) {
            throw new IllegalArgumentException("Aynı fakültede bu isimde bir bina zaten mevcuttur.");
        }
        if (buildingRepository.existsByCodeAndFacultyId(request.getCode(), facultyId)) {
            throw new IllegalArgumentException("Aynı fakültede bu kodda bir bina zaten mevcuttur.");
        }

        Building building = buildingMapper.toEntity(request);
        building.setFaculty(faculty);
        Building savedBuilding = buildingRepository.save(building);
        return enrichResponse(buildingMapper.toResponse(savedBuilding));
    }

    @Transactional
    public BuildingResponse updateBuilding(UUID buildingId, UpdateBuildingRequest request) {
        Building building = buildingRepository.findById(buildingId)
                .orElseThrow(() -> new ResourceNotFoundException("Bina bulunamadı."));

        UUID facultyId = building.getFaculty().getId();

        if (buildingRepository.existsByNameAndFacultyIdAndIdNot(request.getName(), facultyId, buildingId)) {
            throw new IllegalArgumentException("Aynı fakültede bu isimde bir bina zaten mevcuttur.");
        }
        if (buildingRepository.existsByCodeAndFacultyIdAndIdNot(request.getCode(), facultyId, buildingId)) {
            throw new IllegalArgumentException("Aynı fakültede bu kodda bir bina zaten mevcuttur.");
        }

        buildingMapper.updateEntityFromRequest(request, building);
        Building updatedBuilding = buildingRepository.save(building);
        return enrichResponse(buildingMapper.toResponse(updatedBuilding));
    }

    @Transactional
    public void deleteBuilding(UUID buildingId) {
        if (!buildingRepository.existsById(buildingId)) {
            throw new ResourceNotFoundException("Bina bulunamadı.");
        }

        if (floorRepository.existsByBuildingId(buildingId)) {
            throw new IllegalArgumentException("Bu binaya bağlı katlar bulunduğundan silinemez.");
        }

        buildingRepository.deleteById(buildingId);
    }

    private BuildingResponse enrichResponse(BuildingResponse response) {
        if (response == null) return null;
        UUID id = response.getId();
        response.setTotalFloors(floorRepository.countByBuildingId(id));
        response.setTotalClassrooms(classroomRepository.countByFloorBuildingId(id));
        return response;
    }
}
