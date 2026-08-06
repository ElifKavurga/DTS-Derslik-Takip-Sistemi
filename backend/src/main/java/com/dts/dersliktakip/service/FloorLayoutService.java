package com.dts.dersliktakip.service;

import com.dts.dersliktakip.dto.FloorDetailResponse;
import com.dts.dersliktakip.dto.SaveFloorLayoutRequest;
import com.dts.dersliktakip.dto.SpaceObjectResponse;
import com.dts.dersliktakip.entity.Floor;
import com.dts.dersliktakip.entity.FloorLayout;
import com.dts.dersliktakip.entity.SpaceObject;
import com.dts.dersliktakip.entity.SpaceObjectStatus;
import com.dts.dersliktakip.exception.ResourceNotFoundException;
import com.dts.dersliktakip.mapper.SpaceObjectMapper;
import com.dts.dersliktakip.repository.FloorLayoutRepository;
import com.dts.dersliktakip.repository.FloorRepository;
import com.dts.dersliktakip.repository.SpaceObjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FloorLayoutService {

    private final FloorRepository floorRepository;
    private final FloorLayoutRepository floorLayoutRepository;
    private final SpaceObjectRepository spaceObjectRepository;
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

        if (request.getObjects() != null && !request.getObjects().isEmpty()) {
            List<SpaceObject> objects = request.getObjects().stream()
                    .map(req -> {
                        SpaceObject obj = spaceObjectMapper.toEntity(req);
                        obj.setFloor(floor);
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
}
