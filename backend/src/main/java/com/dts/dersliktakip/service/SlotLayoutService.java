package com.dts.dersliktakip.service;

import com.dts.dersliktakip.dto.SaveSlotLayoutRequest;
import com.dts.dersliktakip.dto.SlotLayoutResponse;
import com.dts.dersliktakip.dto.SpaceObjectRequest;
import com.dts.dersliktakip.dto.SpaceObjectResponse;
import com.dts.dersliktakip.entity.Classroom;
import com.dts.dersliktakip.entity.ClassroomType;
import com.dts.dersliktakip.entity.Floor;
import com.dts.dersliktakip.entity.PlanMode;
import com.dts.dersliktakip.entity.SlotLayout;
import com.dts.dersliktakip.entity.SpaceObject;
import com.dts.dersliktakip.entity.SpaceObjectStatus;
import com.dts.dersliktakip.entity.SpaceObjectType;
import com.dts.dersliktakip.exception.ResourceNotFoundException;
import com.dts.dersliktakip.mapper.SpaceObjectMapper;
import com.dts.dersliktakip.repository.ClassroomRepository;
import com.dts.dersliktakip.repository.FloorRepository;
import com.dts.dersliktakip.repository.SlotLayoutRepository;
import com.dts.dersliktakip.repository.SpaceObjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SlotLayoutService {

    private final FloorRepository floorRepository;
    private final SlotLayoutRepository slotLayoutRepository;
    private final SpaceObjectRepository spaceObjectRepository;
    private final ClassroomRepository classroomRepository;
    private final SpaceObjectMapper spaceObjectMapper;

    @Transactional(readOnly = true)
    public SlotLayoutResponse getSlotLayout(UUID floorId) {
        if (!floorRepository.existsById(floorId)) {
            throw new ResourceNotFoundException("Kat bulunamadı.");
        }

        SlotLayout slotLayout = slotLayoutRepository.findByFloorId(floorId)
                .orElseThrow(() -> new ResourceNotFoundException("Slot yerleşimi bulunamadı."));

        return toResponse(slotLayout, getObjects(floorId));
    }

    @Transactional
    public SlotLayoutResponse saveSlotLayout(UUID floorId, SaveSlotLayoutRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Slot yerleşimi isteği boş olamaz.");
        }

        Floor floor = floorRepository.findById(floorId)
                .orElseThrow(() -> new ResourceNotFoundException("Kat bulunamadı."));

        int rows = request.getRows() != null ? request.getRows() : SlotLayout.DEFAULT_ROWS;
        int columns = request.getColumns() != null ? request.getColumns() : SlotLayout.DEFAULT_COLUMNS;
        validateGrid(rows, columns);

        SlotLayout slotLayout = slotLayoutRepository.findByFloorId(floorId)
                .orElseGet(() -> {
                    SlotLayout created = new SlotLayout();
                    created.setFloor(floor);
                    return created;
                });
        slotLayout.setRows(rows);
        slotLayout.setColumns(columns);
        floor.setPlanMode(PlanMode.SLOT_LAYOUT);
        SlotLayout savedLayout = slotLayoutRepository.save(slotLayout);

        if (request.getObjects() != null && !request.getObjects().isEmpty()) {
            saveSlotObjects(floor, rows, columns, request.getObjects());
        }

        return toResponse(savedLayout, getObjects(floorId));
    }

    private void saveSlotObjects(Floor floor, int rows, int columns, List<SpaceObjectRequest> requests) {
        UUID floorId = floor.getId();
        Map<UUID, SpaceObject> existingById = new HashMap<>();
        Map<String, UUID> occupiedSlots = new HashMap<>();
        Map<UUID, UUID> placedClassrooms = new HashMap<>();

        for (SpaceObject existing : spaceObjectRepository.findAllByFloorId(floorId)) {
            existingById.put(existing.getId(), existing);
            if (hasSlot(existing.getSlotRow(), existing.getSlotColumn())) {
                occupiedSlots.put(slotKey(existing.getSlotRow(), existing.getSlotColumn()), existing.getId());
            }
            if (existing.getClassroom() != null) {
                placedClassrooms.put(existing.getClassroom().getId(), existing.getId());
            }
        }

        Set<UUID> requestObjectIds = new HashSet<>();
        Set<String> requestSlots = new HashSet<>();
        Set<UUID> requestClassrooms = new HashSet<>();

        List<SpaceObject> objects = requests.stream()
                .map(request -> {
                    validateSlotObject(request, rows, columns);
                    if (!requestObjectIds.add(request.getId())) {
                        throw new IllegalArgumentException("Aynı nesne ID'si slot yerleşimine birden fazla kez gönderilemez.");
                    }

                    SpaceObject existing = existingById.get(request.getId());
                    if (existing != null && !existing.getFloor().getId().equals(floor.getId())) {
                        throw new IllegalArgumentException("Seçilen fiziksel alan bu kata ait değil.");
                    }

                    if (hasSlot(request.getSlotRow(), request.getSlotColumn())) {
                        String key = slotKey(request.getSlotRow(), request.getSlotColumn());
                        UUID occupiedBy = occupiedSlots.get(key);
                        if (occupiedBy != null && !occupiedBy.equals(request.getId())) {
                            throw new IllegalArgumentException("Bu slot zaten kullanılıyor.");
                        }
                        if (!requestSlots.add(key)) {
                            throw new IllegalArgumentException("Bu slot zaten kullanılıyor.");
                        }
                    }

                    Classroom classroom = resolveClassroom(floor, request);
                    if (classroom != null) {
                        UUID occupiedBy = placedClassrooms.get(classroom.getId());
                        if (occupiedBy != null && !occupiedBy.equals(request.getId())) {
                            throw new IllegalArgumentException("Bu fiziksel alan zaten bu katta yerleştirilmiş.");
                        }
                        if (!requestClassrooms.add(classroom.getId())) {
                            throw new IllegalArgumentException("Bu fiziksel alan zaten bu katta yerleştirilmiş.");
                        }
                    }

                    SpaceObject object = spaceObjectMapper.toEntity(request);
                    object.setFloor(floor);
                    object.setClassroom(classroom);
                    if (existing != null) {
                        object.setCreatedAt(existing.getCreatedAt());
                    }
                    if (classroom != null) {
                        copyClassroomFields(object, classroom);
                    }
                    if (object.getStatus() == null) {
                        object.setStatus(SpaceObjectStatus.EMPTY);
                    }
                    if (object.getWidth() == null) object.setWidth(160.0);
                    if (object.getHeight() == null) object.setHeight(100.0);
                    if (object.getRotation() == null) object.setRotation(0.0);
                    return object;
                })
                .toList();

        spaceObjectRepository.saveAll(objects);
    }

    private void validateGrid(Integer rows, Integer columns) {
        if (rows == null || rows <= 0) {
            throw new IllegalArgumentException("Satır sayısı 0'dan büyük olmalıdır.");
        }
        if (columns == null || columns <= 0) {
            throw new IllegalArgumentException("Sütun sayısı 0'dan büyük olmalıdır.");
        }
    }

    private void validateSlotObject(SpaceObjectRequest request, int rows, int columns) {
        if (request == null) {
            throw new IllegalArgumentException("Slot nesnesi boş olamaz.");
        }
        if (request.getId() == null) {
            throw new IllegalArgumentException("Nesne ID zorunludur.");
        }
        if (request.getType() == null) {
            throw new IllegalArgumentException("Nesne türü zorunludur.");
        }
        boolean hasRow = request.getSlotRow() != null;
        boolean hasColumn = request.getSlotColumn() != null;
        if (hasRow != hasColumn) {
            throw new IllegalArgumentException("Slot satır ve sütun bilgisi birlikte gönderilmelidir.");
        }
        if (hasRow) {
            if (request.getSlotRow() < 0 || request.getSlotRow() >= rows
                    || request.getSlotColumn() < 0 || request.getSlotColumn() >= columns) {
                throw new IllegalArgumentException("Seçilen slot grid sınırları dışında.");
            }
        }
        if (!isClassroomPlacementType(request.getType()) && request.getClassroomId() != null) {
            throw new IllegalArgumentException("Bu nesne türü derslik kaydına bağlanamaz.");
        }
        if (request.getCapacity() != null && request.getCapacity() < 0) {
            throw new IllegalArgumentException("Kapasite negatif olamaz.");
        }
    }

    private Classroom resolveClassroom(Floor floor, SpaceObjectRequest request) {
        if (!isClassroomPlacementType(request.getType())) {
            return null;
        }

        if (request.getClassroomId() != null) {
            Classroom classroom = classroomRepository.findById(request.getClassroomId())
                    .orElseThrow(() -> new ResourceNotFoundException("Derslik bulunamadı."));
            if (!classroom.getFloor().getId().equals(floor.getId())) {
                throw new IllegalArgumentException("Seçilen fiziksel alan bu kata ait değil.");
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

    private Classroom createClassroom(Floor floor, SpaceObjectRequest request, String code) {
        Classroom classroom = new Classroom();
        classroom.setFloor(floor);
        classroom.setCode(code);
        classroom.setName(normalize(request.getLabel()) != null ? normalize(request.getLabel()) : code);
        classroom.setCapacity(request.getCapacity() != null ? request.getCapacity() : 0);
        classroom.setType(toClassroomType(request.getType()));
        return classroomRepository.save(classroom);
    }

    private List<SpaceObjectResponse> getObjects(UUID floorId) {
        return spaceObjectRepository.findAllByFloorId(floorId)
                .stream()
                .map(spaceObjectMapper::toResponse)
                .toList();
    }

    private SlotLayoutResponse toResponse(SlotLayout slotLayout, List<SpaceObjectResponse> objects) {
        return SlotLayoutResponse.builder()
                .id(slotLayout.getId())
                .floorId(slotLayout.getFloor().getId())
                .rows(slotLayout.getRows())
                .columns(slotLayout.getColumns())
                .createdAt(slotLayout.getCreatedAt())
                .updatedAt(slotLayout.getUpdatedAt())
                .objects(objects)
                .build();
    }

    private boolean hasSlot(Integer row, Integer column) {
        return row != null && column != null;
    }

    private String slotKey(Integer row, Integer column) {
        return row + ":" + column;
    }

    private boolean isClassroomPlacementType(SpaceObjectType type) {
        return type == SpaceObjectType.CLASSROOM
                || type == SpaceObjectType.LABORATORY
                || type == SpaceObjectType.AMPHITHEATER;
    }

    private void validateTypeCompatibility(SpaceObjectType objectType, ClassroomType classroomType) {
        if (toClassroomType(objectType) != classroomType) {
            throw new IllegalArgumentException("Derslik türü ile slot nesnesi türü uyumlu değil.");
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

    private void copyClassroomFields(SpaceObject object, Classroom classroom) {
        object.setLabel(classroom.getName());
        object.setCode(classroom.getCode());
        object.setCapacity(classroom.getCapacity());
        object.setType(toSpaceObjectType(classroom.getType()));
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
