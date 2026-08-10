package com.dts.dersliktakip.service;

import com.dts.dersliktakip.dto.FloorDetailResponse;
import com.dts.dersliktakip.dto.ClassroomPlacementResponse;
import com.dts.dersliktakip.dto.SaveFloorLayoutRequest;
import com.dts.dersliktakip.dto.SpaceObjectRequest;
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

import java.util.Base64;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FloorLayoutService {

    private static final int MAX_BACKGROUND_IMAGE_BYTES = 5 * 1024 * 1024;
    private static final double MIN_BACKGROUND_OPACITY = 0.1;
    private static final double MAX_BACKGROUND_OPACITY = 1.0;
    private static final Set<String> SUPPORTED_BACKGROUND_TYPES = Set.of("image/png", "image/jpeg");

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
                .backgroundLocked(layout != null ? layout.getBackgroundLocked() : false)
                .viewportX(layout != null ? layout.getViewportX() : 0.0)
                .viewportY(layout != null ? layout.getViewportY() : 0.0)
                .viewportZoom(layout != null ? layout.getViewportZoom() : 1.0)
                .objects(objects)
                .build();
    }

    @Transactional(readOnly = true)
    public List<ClassroomPlacementResponse> getClassroomsForPlacement(UUID floorId) {
        if (!floorRepository.existsById(floorId)) {
            throw new ResourceNotFoundException("Kat bulunamadı.");
        }

        return classroomRepository.findAllByFloorIdOrderByCodeAsc(floorId)
                .stream()
                .map(classroom -> ClassroomPlacementResponse.builder()
                        .id(classroom.getId())
                        .name(classroom.getName())
                        .code(classroom.getCode())
                        .capacity(classroom.getCapacity())
                        .type(classroom.getType())
                        .build())
                .toList();
    }

    @Transactional
    public FloorDetailResponse saveLayout(UUID floorId, SaveFloorLayoutRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Kat planı isteği boş olamaz.");
        }

        Floor floor = floorRepository.findById(floorId)
                .orElseThrow(() -> new ResourceNotFoundException("Kat bulunamadı."));

        // Update or create layout record
        FloorLayout layout = floorLayoutRepository.findByFloorId(floorId)
                .orElseGet(() -> {
                    FloorLayout newLayout = new FloorLayout();
                    newLayout.setFloor(floor);
                    return newLayout;
                });

        validateBackground(request);
        validateCanvasState(request);

        layout.setBackgroundImageBase64(normalize(request.getBackgroundImageBase64()));
        layout.setBackgroundImageType(normalize(request.getBackgroundImageType()));
        layout.setBackgroundX(request.getBackgroundX() != null ? request.getBackgroundX() : 0.0);
        layout.setBackgroundY(request.getBackgroundY() != null ? request.getBackgroundY() : 0.0);
        layout.setBackgroundWidth(request.getBackgroundWidth());
        layout.setBackgroundHeight(request.getBackgroundHeight());
        layout.setBackgroundOpacity(request.getBackgroundOpacity() != null ? request.getBackgroundOpacity() : 0.35);
        layout.setBackgroundLocked(request.getBackgroundLocked() != null ? request.getBackgroundLocked() : false);
        layout.setViewportX(request.getViewportX() != null ? request.getViewportX() : 0.0);
        layout.setViewportY(request.getViewportY() != null ? request.getViewportY() : 0.0);
        layout.setViewportZoom(request.getViewportZoom() != null ? request.getViewportZoom() : 1.0);
        floorLayoutRepository.save(layout);

        // Replace all space objects atomically
        spaceObjectRepository.deleteAllByFloorId(floorId);
        spaceObjectRepository.flush();

        if (request.getObjects() != null && !request.getObjects().isEmpty()) {
            Set<UUID> spaceObjectIds = new HashSet<>();
            Set<UUID> linkedClassroomIds = new HashSet<>();
            List<SpaceObject> objects = request.getObjects().stream()
                    .map(req -> {
                        validateSpaceObject(req);
                        if (!spaceObjectIds.add(req.getId())) {
                            throw new IllegalArgumentException("Aynı nesne ID'si kat planına birden fazla kez gönderilemez.");
                        }
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

    private void validateSpaceObject(SpaceObjectRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Kat planı nesnesi boş olamaz.");
        }
        if (request.getId() == null) {
            throw new IllegalArgumentException("Nesne ID zorunludur.");
        }
        if (request.getType() == null) {
            throw new IllegalArgumentException("Nesne türü zorunludur.");
        }
        validateRequiredFinite(request.getPositionX(), "Nesne X konumu");
        validateRequiredFinite(request.getPositionY(), "Nesne Y konumu");
        validateOptionalPositiveDimension(request.getWidth(), "Nesne genişliği");
        validateOptionalPositiveDimension(request.getHeight(), "Nesne yüksekliği");
        if (request.getRotation() != null && !Double.isFinite(request.getRotation())) {
            throw new IllegalArgumentException("Nesne dönüş değeri geçerli olmalıdır.");
        }
        if (!isClassroomPlacementType(request.getType()) && request.getClassroomId() != null) {
            throw new IllegalArgumentException("Bu nesne türü derslik kaydına bağlanamaz.");
        }
        if (request.getCapacity() != null && request.getCapacity() < 0) {
            throw new IllegalArgumentException("Kapasite negatif olamaz.");
        }
    }

    private void validateCanvasState(SaveFloorLayoutRequest request) {
        validateOptionalFinite(request.getBackgroundX(), "Kroki X konumu");
        validateOptionalFinite(request.getBackgroundY(), "Kroki Y konumu");
        validateOptionalFinite(request.getViewportX(), "Görünüm X konumu");
        validateOptionalFinite(request.getViewportY(), "Görünüm Y konumu");
        if (request.getViewportZoom() != null
                && (!Double.isFinite(request.getViewportZoom()) || request.getViewportZoom() <= 0)) {
            throw new IllegalArgumentException("Görünüm yakınlaştırma değeri pozitif olmalıdır.");
        }
    }

    private void validateBackground(SaveFloorLayoutRequest request) {
        String imageBase64 = normalize(request.getBackgroundImageBase64());
        String imageType = normalize(request.getBackgroundImageType());

        if (imageBase64 == null && imageType == null) {
            validateOptionalPositiveDimension(request.getBackgroundWidth(), "Kroki genişliği");
            validateOptionalPositiveDimension(request.getBackgroundHeight(), "Kroki yüksekliği");
            validateOpacity(request.getBackgroundOpacity());
            return;
        }

        if (imageBase64 == null || imageType == null) {
            throw new IllegalArgumentException("Kat krokisi görseli ve dosya türü birlikte gönderilmelidir.");
        }

        if (!SUPPORTED_BACKGROUND_TYPES.contains(imageType)) {
            throw new IllegalArgumentException("Kat krokisi için yalnızca PNG veya JPG/JPEG desteklenir.");
        }

        byte[] imageBytes;
        try {
            imageBytes = Base64.getDecoder().decode(imageBase64);
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException("Kat krokisi geçerli bir Base64 görsel değil.");
        }

        if (imageBytes.length == 0) {
            throw new IllegalArgumentException("Kat krokisi boş olamaz.");
        }
        if (imageBytes.length > MAX_BACKGROUND_IMAGE_BYTES) {
            throw new IllegalArgumentException("Kat krokisi en fazla 5 MB olabilir.");
        }
        if (!matchesImageSignature(imageType, imageBytes)) {
            throw new IllegalArgumentException("Kat krokisi dosya türü ile içeriği uyumlu değil.");
        }

        validateOptionalPositiveDimension(request.getBackgroundWidth(), "Kroki genişliği");
        validateOptionalPositiveDimension(request.getBackgroundHeight(), "Kroki yüksekliği");
        validateOpacity(request.getBackgroundOpacity());
    }

    private boolean matchesImageSignature(String imageType, byte[] bytes) {
        if ("image/png".equals(imageType)) {
            return bytes.length >= 8
                    && (bytes[0] & 0xFF) == 0x89
                    && bytes[1] == 0x50
                    && bytes[2] == 0x4E
                    && bytes[3] == 0x47
                    && bytes[4] == 0x0D
                    && bytes[5] == 0x0A
                    && bytes[6] == 0x1A
                    && bytes[7] == 0x0A;
        }
        if ("image/jpeg".equals(imageType)) {
            return bytes.length >= 3
                    && (bytes[0] & 0xFF) == 0xFF
                    && (bytes[1] & 0xFF) == 0xD8
                    && (bytes[2] & 0xFF) == 0xFF;
        }
        return false;
    }

    private void validateOptionalPositiveDimension(Double value, String fieldName) {
        if (value != null && (!Double.isFinite(value) || value <= 0)) {
            throw new IllegalArgumentException(fieldName + " pozitif bir değer olmalıdır.");
        }
    }

    private void validateRequiredFinite(Double value, String fieldName) {
        if (value == null || !Double.isFinite(value)) {
            throw new IllegalArgumentException(fieldName + " geçerli bir değer olmalıdır.");
        }
    }

    private void validateOptionalFinite(Double value, String fieldName) {
        if (value != null && !Double.isFinite(value)) {
            throw new IllegalArgumentException(fieldName + " geçerli bir değer olmalıdır.");
        }
    }

    private void validateOpacity(Double opacity) {
        if (opacity != null && (!Double.isFinite(opacity)
                || opacity < MIN_BACKGROUND_OPACITY
                || opacity > MAX_BACKGROUND_OPACITY)) {
            throw new IllegalArgumentException("Kroki saydamlığı 0.1 ile 1.0 arasında olmalıdır.");
        }
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
