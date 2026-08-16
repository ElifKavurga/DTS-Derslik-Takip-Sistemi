package com.dts.dersliktakip.service;

import com.dts.dersliktakip.dto.PublicBuildingResponse;
import com.dts.dersliktakip.dto.PublicFacultyResponse;
import com.dts.dersliktakip.dto.PublicFloorDetailResponse;
import com.dts.dersliktakip.dto.PublicFloorResponse;
import com.dts.dersliktakip.dto.PublicSpaceObjectResponse;
import com.dts.dersliktakip.entity.Building;
import com.dts.dersliktakip.entity.Classroom;
import com.dts.dersliktakip.entity.ClassroomType;
import com.dts.dersliktakip.entity.Faculty;
import com.dts.dersliktakip.entity.Floor;
import com.dts.dersliktakip.entity.FloorLayout;
import com.dts.dersliktakip.entity.SpaceObject;
import com.dts.dersliktakip.entity.SpaceObjectStatus;
import com.dts.dersliktakip.entity.SpaceObjectType;
import com.dts.dersliktakip.exception.ResourceNotFoundException;
import com.dts.dersliktakip.repository.BuildingRepository;
import com.dts.dersliktakip.repository.ClassroomRepository;
import com.dts.dersliktakip.repository.FacultyRepository;
import com.dts.dersliktakip.repository.FloorLayoutRepository;
import com.dts.dersliktakip.repository.FloorRepository;
import com.dts.dersliktakip.repository.SpaceObjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PublicCampusService {

    private final FacultyRepository facultyRepository;
    private final BuildingRepository buildingRepository;
    private final FloorRepository floorRepository;
    private final FloorLayoutRepository floorLayoutRepository;
    private final SpaceObjectRepository spaceObjectRepository;
    private final ClassroomRepository classroomRepository;

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

    @Transactional(readOnly = true)
    public List<PublicFloorResponse> getFloorsByBuildingId(UUID buildingId) {
        if (!buildingRepository.existsById(buildingId)) {
            throw new ResourceNotFoundException("Bina bulunamadı.");
        }

        return floorRepository.findAllByBuildingIdOrderByLevelAsc(buildingId).stream()
                .map(this::toFloorResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public PublicFloorDetailResponse getFloorView(UUID buildingId, UUID floorId) {
        Floor floor = floorRepository.findByIdAndBuildingId(floorId, buildingId)
                .orElseThrow(() -> new ResourceNotFoundException("Kat bulunamadı."));

        FloorLayout layout = floorLayoutRepository.findByFloorId(floorId).orElse(null);
        List<PublicSpaceObjectResponse> placedObjects = spaceObjectRepository
                .findAllByFloorIdOrderBySlotRowAscSlotColumnAscPositionYAscPositionXAsc(floorId)
                .stream()
                .filter(spaceObject -> isTeachingSpace(spaceObject.getType()))
                .map(this::toSpaceObjectResponse)
                .toList();
        Set<UUID> placedClassroomIds = placedObjects.stream()
                .map(PublicSpaceObjectResponse::getClassroomId)
                .filter(id -> id != null)
                .collect(Collectors.toSet());
        List<PublicSpaceObjectResponse> unplacedClassrooms = classroomRepository.findAllByFloorIdOrderByCodeAsc(floorId)
                .stream()
                .filter(classroom -> !placedClassroomIds.contains(classroom.getId()))
                .map(this::toUnplacedClassroomResponse)
                .toList();
        List<PublicSpaceObjectResponse> objects = java.util.stream.Stream
                .concat(placedObjects.stream(), unplacedClassrooms.stream())
                .toList();

        return PublicFloorDetailResponse.builder()
                .id(floor.getId())
                .name(floor.getName())
                .level(floor.getLevel())
                .buildingId(floor.getBuilding().getId())
                .buildingName(floor.getBuilding().getName())
                .facultyId(floor.getBuilding().getFaculty().getId())
                .facultyName(floor.getBuilding().getFaculty().getName())
                .backgroundImageBase64(layout != null ? layout.getBackgroundImageBase64() : null)
                .backgroundImageType(layout != null ? layout.getBackgroundImageType() : null)
                .backgroundX(layout != null ? layout.getBackgroundX() : 0.0)
                .backgroundY(layout != null ? layout.getBackgroundY() : 0.0)
                .backgroundWidth(layout != null ? layout.getBackgroundWidth() : null)
                .backgroundHeight(layout != null ? layout.getBackgroundHeight() : null)
                .backgroundOpacity(layout != null ? layout.getBackgroundOpacity() : 0.35)
                .objects(objects)
                .build();
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

    private PublicFloorResponse toFloorResponse(Floor floor) {
        return PublicFloorResponse.builder()
                .id(floor.getId())
                .name(floor.getName())
                .level(floor.getLevel())
                .buildingId(floor.getBuilding().getId())
                .build();
    }

    private PublicSpaceObjectResponse toSpaceObjectResponse(SpaceObject spaceObject) {
        return PublicSpaceObjectResponse.builder()
                .id(spaceObject.getId())
                .classroomId(spaceObject.getClassroom() != null ? spaceObject.getClassroom().getId() : null)
                .type(spaceObject.getType())
                .status(spaceObject.getStatus())
                .label(spaceObject.getLabel())
                .code(spaceObject.getCode())
                .capacity(spaceObject.getCapacity())
                .positionX(spaceObject.getPositionX())
                .positionY(spaceObject.getPositionY())
                .width(spaceObject.getWidth())
                .height(spaceObject.getHeight())
                .rotation(spaceObject.getRotation())
                .slotRow(spaceObject.getSlotRow())
                .slotColumn(spaceObject.getSlotColumn())
                .placed(true)
                .build();
    }

    private PublicSpaceObjectResponse toUnplacedClassroomResponse(Classroom classroom) {
        return PublicSpaceObjectResponse.builder()
                .id(classroom.getId())
                .classroomId(classroom.getId())
                .type(toSpaceObjectType(classroom.getType()))
                .status(SpaceObjectStatus.EMPTY)
                .label(classroom.getName())
                .code(classroom.getCode())
                .capacity(classroom.getCapacity())
                .positionX(0.0)
                .positionY(0.0)
                .width(160.0)
                .height(100.0)
                .rotation(0.0)
                .placed(false)
                .build();
    }

    private boolean isTeachingSpace(SpaceObjectType type) {
        return type == SpaceObjectType.CLASSROOM
                || type == SpaceObjectType.LABORATORY
                || type == SpaceObjectType.AMPHITHEATER;
    }

    private SpaceObjectType toSpaceObjectType(ClassroomType type) {
        return switch (type) {
            case CLASSROOM -> SpaceObjectType.CLASSROOM;
            case LABORATORY -> SpaceObjectType.LABORATORY;
            case AMPHITHEATER -> SpaceObjectType.AMPHITHEATER;
        };
    }
}
