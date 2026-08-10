package com.dts.dersliktakip.service;

import com.dts.dersliktakip.dto.FloorDetailResponse;
import com.dts.dersliktakip.dto.SaveFloorLayoutRequest;
import com.dts.dersliktakip.dto.SpaceObjectResponse;
import com.dts.dersliktakip.entity.Classroom;
import com.dts.dersliktakip.entity.ClassroomType;
import com.dts.dersliktakip.entity.Floor;
import com.dts.dersliktakip.entity.FloorLayout;
import com.dts.dersliktakip.entity.SpaceObject;
import com.dts.dersliktakip.entity.SpaceObjectStatus;
import com.dts.dersliktakip.entity.SpaceObjectType;
import com.dts.dersliktakip.exception.ResourceNotFoundException;
import com.dts.dersliktakip.mapper.SpaceObjectMapper;
import com.dts.dersliktakip.repository.ClassroomRepository;
import com.dts.dersliktakip.repository.FloorLayoutRepository;
import com.dts.dersliktakip.repository.FloorRepository;
import com.dts.dersliktakip.repository.SpaceObjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FloorLayoutService {

    private final FloorRepository floorRepository;
    private final FloorLayoutRepository floorLayoutRepository;
    private final SpaceObjectRepository spaceObjectRepository;
    private final ClassroomRepository classroomRepository;
    private final SpaceObjectMapper spaceObjectMapper;

    @Transactional(readOnly = true)
    public FloorDetailResponse getFloorDetail(UUID floorId) {
        Floor floor = floorRepository.findById(floorId)
                .orElseThrow(() -> new ResourceNotFoundException("Kat bulunamadı."));

        FloorLayout layout = floorLayoutRepository.findByFloorId(floorId).orElse(null);

        List<SpaceObjectResponse> objects = spaceObjectRepository.findAllByFloorId(floorId)
                .stream()
                .map(spaceObjectMapper::toResponse)
                .toList();

        return FloorDetailResponse.builder()
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
                .backgroundLocked(layout != null ? layout.getBackgroundLocked() : true)
                .viewportX(layout != null ? layout.getViewportX() : 0.0)
                .viewportY(layout != null ? layout.getViewportY() : 0.0)
                .viewportZoom(layout != null ? layout.getViewportZoom() : 1.0)
                .objects(objects)
                .build();
    }

    @Transactional
    public FloorDetailResponse saveLayout(UUID floorId, SaveFloorLayoutRequest request) {
        Floor floor = floorRepository.findById(floorId)
                .orElseThrow(() -> new ResourceNotFoundException("Kat bulunamadı."));

        // Update or create layout record
        FloorLayout layout = floorLayoutRepository.findByFloorId(floorId)
                .orElseGet(() -> {
                    FloorLayout newLayout = new FloorLayout();
                    newLayout.setFloor(floor);
                    return newLayout;
                });

        layout.setBackgroundImageBase64(request.getBackgroundImageBase64());
        layout.setBackgroundImageType(request.getBackgroundImageType());
        layout.setBackgroundX(request.getBackgroundX() != null ? request.getBackgroundX() : 0.0);
        layout.setBackgroundY(request.getBackgroundY() != null ? request.getBackgroundY() : 0.0);
        layout.setBackgroundWidth(request.getBackgroundWidth());
        layout.setBackgroundHeight(request.getBackgroundHeight());
        layout.setBackgroundOpacity(request.getBackgroundOpacity() != null ? request.getBackgroundOpacity() : 0.35);
        layout.setBackgroundLocked(request.getBackgroundLocked() != null ? request.getBackgroundLocked() : true);
        layout.setViewportX(request.getViewportX() != null ? request.getViewportX() : 0.0);
        layout.setViewportY(request.getViewportY() != null ? request.getViewportY() : 0.0);
        layout.setViewportZoom(request.getViewportZoom() != null ? request.getViewportZoom() : 1.0);
        floorLayoutRepository.save(layout);

        // Replace all space objects atomically
        spaceObjectRepository.deleteAllByFloorId(floorId);
        spaceObjectRepository.flush();

        if (request.getObjects() != null && !request.getObjects().isEmpty()) {
            Set<UUID> linkedClassroomIds = new HashSet<>();
            List<SpaceObject> objects = request.getObjects().stream()
                    .map(req -> {
                        SpaceObject obj = spaceObjectMapper.toEntity(req);
                        obj.setFloor(floor);
                        Classroom classroom = resolveClassroom(floor, req);
                        obj.setClassroom(classroom);
                        if (classroom != null) {
                            if (!linkedClassroomIds.add(classroom.getId())) {
                                throw new IllegalArgumentException("Aynı derslik kat planına birden fazla kez yerleştirilemez.");
                            }
                            copyClassroomFields(obj, classroom);
                        }
                        if (obj.getStatus() == null) {
                            obj.setStatus(SpaceObjectStatus.EMPTY);
                        }
                        if (obj.getWidth() == null) obj.setWidth(160.0);
                        if (obj.getHeight() == null) obj.setHeight(100.0);
                        if (obj.getRotation() == null) obj.setRotation(0.0);
                        return obj;
                    })
                    .toList();
            spaceObjectRepository.saveAll(objects);
        }

        return getFloorDetail(floorId);
    }

    private Classroom resolveClassroom(Floor floor, com.dts.dersliktakip.dto.SpaceObjectRequest request) {
        if (!isClassroomPlacementType(request.getType())) {
            return null;
        }

        if (request.getClassroomId() != null) {
            Classroom classroom = classroomRepository.findById(request.getClassroomId())
                    .orElseThrow(() -> new ResourceNotFoundException("Derslik bulunamadı."));
            if (!classroom.getFloor().getId().equals(floor.getId())) {
                throw new IllegalArgumentException("Seçilen derslik bu kata ait değil.");
            }
            validateTypeCompatibility(request.getType(), classroom.getType());
            return classroom;
        }

        String resolvedCode = normalize(request.getCode());
        if (resolvedCode == null) {
            resolvedCode = normalize(request.getLabel());
        }
        if (resolvedCode == null) {
            throw new IllegalArgumentException("Derslik, laboratuvar veya amfi için kod ya da ad zorunludur.");
        }
        String classroomCode = resolvedCode;

        return classroomRepository.findByFloorIdAndCodeIgnoreCase(floor.getId(), classroomCode)
                .map(existing -> {
                    validateTypeCompatibility(request.getType(), existing.getType());
                    return existing;
                })
                .orElseGet(() -> createClassroom(floor, request, classroomCode));
    }

    private Classroom createClassroom(Floor floor, com.dts.dersliktakip.dto.SpaceObjectRequest request, String code) {
        Classroom classroom = new Classroom();
        classroom.setFloor(floor);
        classroom.setCode(code);
        classroom.setName(normalize(request.getLabel()) != null ? normalize(request.getLabel()) : code);
        classroom.setCapacity(request.getCapacity() != null ? request.getCapacity() : 0);
        classroom.setType(toClassroomType(request.getType()));
        return classroomRepository.save(classroom);
    }

    private void copyClassroomFields(SpaceObject object, Classroom classroom) {
        object.setLabel(classroom.getName());
        object.setCode(classroom.getCode());
        object.setCapacity(classroom.getCapacity());
        object.setType(toSpaceObjectType(classroom.getType()));
    }

    private boolean isClassroomPlacementType(SpaceObjectType type) {
        return type == SpaceObjectType.CLASSROOM
                || type == SpaceObjectType.LABORATORY
                || type == SpaceObjectType.AMPHITHEATER;
    }

    private void validateTypeCompatibility(SpaceObjectType objectType, ClassroomType classroomType) {
        if (toClassroomType(objectType) != classroomType) {
            throw new IllegalArgumentException("Derslik türü ile kroki nesnesi türü uyumlu değil.");
        }
    }

    private ClassroomType toClassroomType(SpaceObjectType type) {
        return switch (type) {
            case CLASSROOM -> ClassroomType.CLASSROOM;
            case LABORATORY -> ClassroomType.LABORATORY;
            case AMPHITHEATER -> ClassroomType.AMPHITHEATER;
            default -> throw new IllegalArgumentException("Bu nesne türü derslik kaydına bağlanamaz.");
        };
    }

    private SpaceObjectType toSpaceObjectType(ClassroomType type) {
        return switch (type) {
            case CLASSROOM -> SpaceObjectType.CLASSROOM;
            case LABORATORY -> SpaceObjectType.LABORATORY;
            case AMPHITHEATER -> SpaceObjectType.AMPHITHEATER;
        };
    }

    private String normalize(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
