package com.dts.dersliktakip.service;

import com.dts.dersliktakip.dto.CreateFloorRequest;
import com.dts.dersliktakip.dto.FloorResponse;
import com.dts.dersliktakip.dto.UpdateFloorRequest;
import com.dts.dersliktakip.entity.Building;
import com.dts.dersliktakip.entity.User;
import com.dts.dersliktakip.entity.Floor;
import com.dts.dersliktakip.entity.PlanMode;
import com.dts.dersliktakip.exception.ResourceNotFoundException;
import com.dts.dersliktakip.mapper.FloorMapper;
import com.dts.dersliktakip.repository.BuildingRepository;
import com.dts.dersliktakip.repository.ClassroomRepository;
import com.dts.dersliktakip.repository.FloorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FloorService {

    private final FloorRepository floorRepository;
    private final BuildingRepository buildingRepository;
    private final ClassroomRepository classroomRepository;
    private final FloorMapper floorMapper;
    private final AccessScopeService accessScopeService;

    @Transactional(readOnly = true)
    public List<FloorResponse> getFloorsByBuildingId(UUID buildingId, User currentUser) {
        Building building = buildingRepository.findById(buildingId)
                .orElseThrow(() -> new ResourceNotFoundException("Bina bulunamadı."));
        accessScopeService.assertFacultyAccess(currentUser, building.getFaculty().getId());

        List<Floor> floors = floorRepository.findAllByBuildingIdOrderByLevelAsc(buildingId);
        return floors.stream()
                .map(floorMapper::toResponse)
                .map(this::enrichResponse)
                .toList();
    }

    @Transactional
    public FloorResponse createFloor(UUID buildingId, CreateFloorRequest request) {
        Building building = buildingRepository.findById(buildingId)
                .orElseThrow(() -> new ResourceNotFoundException("Bina bulunamadı."));

        if (floorRepository.existsByLevelAndBuildingId(request.getLevel(), buildingId)) {
            throw new IllegalArgumentException("Aynı binada bu kat numarası zaten mevcuttur.");
        }

        Floor floor = floorMapper.toEntity(request);
        floor.setBuilding(building);
        floor.setPlanMode(request.getPlanMode() != null ? request.getPlanMode() : PlanMode.FLOOR_PLAN);
        Floor savedFloor = floorRepository.save(floor);
        return enrichResponse(floorMapper.toResponse(savedFloor));
    }

    @Transactional
    public FloorResponse updateFloor(UUID floorId, UpdateFloorRequest request) {
        Floor floor = floorRepository.findById(floorId)
                .orElseThrow(() -> new ResourceNotFoundException("Kat bulunamadı."));

        UUID buildingId = floor.getBuilding().getId();

        if (floorRepository.existsByLevelAndBuildingIdAndIdNot(request.getLevel(), buildingId, floorId)) {
            throw new IllegalArgumentException("Aynı binada bu kat numarası zaten mevcuttur.");
        }

        floorMapper.updateEntityFromRequest(request, floor);
        if (request.getPlanMode() != null) {
            floor.setPlanMode(request.getPlanMode());
        }
        Floor updatedFloor = floorRepository.save(floor);
        return enrichResponse(floorMapper.toResponse(updatedFloor));
    }

    @Transactional
    public void deleteFloor(UUID floorId) {
        if (!floorRepository.existsById(floorId)) {
            throw new ResourceNotFoundException("Kat bulunamadı.");
        }

        if (classroomRepository.existsByFloorId(floorId)) {
            throw new IllegalArgumentException("Bu katta derslikler bulunduğundan silinemez.");
        }

        floorRepository.deleteById(floorId);
    }

    private FloorResponse enrichResponse(FloorResponse response) {
        if (response == null) return null;
        UUID id = response.getId();
        response.setTotalClassrooms(classroomRepository.countByFloorId(id));
        return response;
    }
}
