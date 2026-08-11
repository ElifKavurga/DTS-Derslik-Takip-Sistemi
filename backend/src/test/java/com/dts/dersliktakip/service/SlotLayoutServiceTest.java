package com.dts.dersliktakip.service;

import com.dts.dersliktakip.dto.CreateSlotClassroomRequest;
import com.dts.dersliktakip.dto.SaveSlotLayoutRequest;
import com.dts.dersliktakip.dto.SlotLayoutResponse;
import com.dts.dersliktakip.dto.SpaceObjectRequest;
import com.dts.dersliktakip.entity.Building;
import com.dts.dersliktakip.entity.Classroom;
import com.dts.dersliktakip.entity.ClassroomType;
import com.dts.dersliktakip.entity.Faculty;
import com.dts.dersliktakip.entity.Floor;
import com.dts.dersliktakip.entity.PlanMode;
import com.dts.dersliktakip.entity.SlotLayout;
import com.dts.dersliktakip.entity.SpaceObjectStatus;
import com.dts.dersliktakip.entity.SpaceObjectType;
import com.dts.dersliktakip.repository.BuildingRepository;
import com.dts.dersliktakip.repository.ClassroomRepository;
import com.dts.dersliktakip.repository.FacultyRepository;
import com.dts.dersliktakip.repository.FloorLayoutRepository;
import com.dts.dersliktakip.repository.FloorRepository;
import com.dts.dersliktakip.repository.SlotLayoutRepository;
import com.dts.dersliktakip.repository.SpaceObjectRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
class SlotLayoutServiceTest {

    @Autowired
    private SlotLayoutService slotLayoutService;

    @Autowired
    private SlotLayoutRepository slotLayoutRepository;

    @Autowired
    private SpaceObjectRepository spaceObjectRepository;

    @Autowired
    private FloorLayoutRepository floorLayoutRepository;

    @Autowired
    private ClassroomRepository classroomRepository;

    @Autowired
    private FloorRepository floorRepository;

    @Autowired
    private BuildingRepository buildingRepository;

    @Autowired
    private FacultyRepository facultyRepository;

    private Floor floor;
    private Classroom classroom;
    private Classroom secondClassroom;
    private Classroom laboratory;
    private Classroom amphitheater;

    @BeforeEach
    void setUp() {
        cleanDatabase();

        Faculty faculty = new Faculty();
        faculty.setName("Slot Fakültesi");
        faculty.setCode("SLT");
        faculty = facultyRepository.save(faculty);

        Building building = new Building();
        building.setName("Slot Binası");
        building.setCode("SLT-B");
        building.setFaculty(faculty);
        building = buildingRepository.save(building);

        floor = new Floor();
        floor.setName("Slot Katı");
        floor.setLevel(2);
        floor.setBuilding(building);
        floor = floorRepository.save(floor);

        classroom = createClassroom("D101", ClassroomType.CLASSROOM);
        secondClassroom = createClassroom("D102", ClassroomType.CLASSROOM);
        laboratory = createClassroom("LAB01", ClassroomType.LABORATORY);
        amphitheater = createClassroom("AMF01", ClassroomType.AMPHITHEATER);
    }

    @AfterEach
    void tearDown() {
        cleanDatabase();
    }

    @Test
    void newFloorDefaultsToFloorPlanMode() {
        assertThat(floor.getPlanMode()).isEqualTo(PlanMode.FLOOR_PLAN);
    }

    @Test
    void saveSlotLayoutCreatesDefaultGridAndSwitchesPlanMode() {
        SlotLayoutResponse response = slotLayoutService.saveSlotLayout(
                floor.getId(),
                SaveSlotLayoutRequest.builder().build()
        );

        Floor reloadedFloor = floorRepository.findById(floor.getId()).orElseThrow();

        assertThat(response.getRows()).isEqualTo(SlotLayout.DEFAULT_ROWS);
        assertThat(response.getColumns()).isEqualTo(SlotLayout.DEFAULT_COLUMNS);
        assertThat(response.getFloorId()).isEqualTo(floor.getId());
        assertThat(reloadedFloor.getPlanMode()).isEqualTo(PlanMode.SLOT_LAYOUT);
    }

    @Test
    void databaseRejectsSecondSlotLayoutForSameFloor() {
        SlotLayout first = new SlotLayout();
        first.setFloor(floor);
        slotLayoutRepository.saveAndFlush(first);

        SlotLayout second = new SlotLayout();
        second.setFloor(floor);

        assertThatThrownBy(() -> slotLayoutRepository.saveAndFlush(second))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void saveSlotLayoutRejectsInvalidRows() {
        SaveSlotLayoutRequest request = SaveSlotLayoutRequest.builder()
                .rows(0)
                .columns(4)
                .build();

        assertThatThrownBy(() -> slotLayoutService.saveSlotLayout(floor.getId(), request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Satır sayısı");
    }

    @Test
    void saveSlotLayoutRejectsInvalidColumns() {
        SaveSlotLayoutRequest request = SaveSlotLayoutRequest.builder()
                .rows(3)
                .columns(0)
                .build();

        assertThatThrownBy(() -> slotLayoutService.saveSlotLayout(floor.getId(), request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Sütun sayısı");
    }

    @Test
    void saveSlotLayoutRejectsOutOfBoundsSlot() {
        SpaceObjectRequest object = slotObject(SpaceObjectType.CLASSROOM, classroom.getId(), 3, 0);
        SaveSlotLayoutRequest request = SaveSlotLayoutRequest.builder()
                .rows(3)
                .columns(4)
                .objects(List.of(object))
                .build();

        assertThatThrownBy(() -> slotLayoutService.saveSlotLayout(floor.getId(), request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("grid sınırları");
    }

    @Test
    void saveSlotLayoutRejectsDuplicateSlot() {
        SaveSlotLayoutRequest request = SaveSlotLayoutRequest.builder()
                .rows(3)
                .columns(4)
                .objects(List.of(
                        slotObject(SpaceObjectType.CLASSROOM, classroom.getId(), 0, 0),
                        slotObject(SpaceObjectType.CLASSROOM, secondClassroom.getId(), 0, 0)
                ))
                .build();

        assertThatThrownBy(() -> slotLayoutService.saveSlotLayout(floor.getId(), request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("slot zaten kullanılıyor");
    }

    @Test
    void saveSlotLayoutRejectsDuplicateClassroomPlacement() {
        SaveSlotLayoutRequest request = SaveSlotLayoutRequest.builder()
                .rows(3)
                .columns(4)
                .objects(List.of(
                        slotObject(SpaceObjectType.CLASSROOM, classroom.getId(), 0, 0),
                        slotObject(SpaceObjectType.CLASSROOM, classroom.getId(), 0, 1)
                ))
                .build();

        assertThatThrownBy(() -> slotLayoutService.saveSlotLayout(floor.getId(), request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("zaten bu katta yerleştirilmiş");
    }

    @Test
    void saveSlotLayoutRejectsDuplicateLaboratoryPlacement() {
        SaveSlotLayoutRequest request = SaveSlotLayoutRequest.builder()
                .rows(3)
                .columns(4)
                .objects(List.of(
                        slotObject(SpaceObjectType.LABORATORY, laboratory.getId(), 0, 0),
                        slotObject(SpaceObjectType.LABORATORY, laboratory.getId(), 0, 1)
                ))
                .build();

        assertThatThrownBy(() -> slotLayoutService.saveSlotLayout(floor.getId(), request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("zaten bu katta yerleştirilmiş");
    }

    @Test
    void saveSlotLayoutAllowsUnassignedClassroomPlacement() {
        SpaceObjectRequest object = slotObject(SpaceObjectType.CLASSROOM, classroom.getId(), null, null);
        SaveSlotLayoutRequest request = SaveSlotLayoutRequest.builder()
                .rows(3)
                .columns(4)
                .objects(List.of(object))
                .build();

        slotLayoutService.saveSlotLayout(floor.getId(), request);

        assertThat(spaceObjectRepository.findAllByFloorId(floor.getId()))
                .hasSize(1)
                .first()
                .satisfies(spaceObject -> {
                    assertThat(spaceObject.getSlotRow()).isNull();
                    assertThat(spaceObject.getSlotColumn()).isNull();
                });
    }

    @Test
    void saveSlotLayoutAllowsLaboratoryAndAmphitheaterObjects() {
        SaveSlotLayoutRequest request = SaveSlotLayoutRequest.builder()
                .rows(3)
                .columns(4)
                .objects(List.of(
                        slotObject(SpaceObjectType.CLASSROOM, classroom.getId(), 0, 0),
                        slotObject(SpaceObjectType.LABORATORY, laboratory.getId(), 0, 1),
                        slotObject(SpaceObjectType.AMPHITHEATER, amphitheater.getId(), 0, 2)
                ))
                .build();

        SlotLayoutResponse response = slotLayoutService.saveSlotLayout(floor.getId(), request);

        assertThat(response.getObjects()).hasSize(3);
        assertThat(response.getObjects())
                .extracting("type")
                .containsExactlyInAnyOrder(SpaceObjectType.CLASSROOM, SpaceObjectType.LABORATORY, SpaceObjectType.AMPHITHEATER);
    }

    @Test
    void saveSlotLayoutReloadKeepsMixedTeachingSpacePlacements() {
        SaveSlotLayoutRequest request = SaveSlotLayoutRequest.builder()
                .rows(3)
                .columns(4)
                .objects(List.of(
                        slotObject(SpaceObjectType.CLASSROOM, classroom.getId(), 0, 0),
                        slotObject(SpaceObjectType.LABORATORY, laboratory.getId(), 0, 1),
                        slotObject(SpaceObjectType.AMPHITHEATER, amphitheater.getId(), 0, 2)
                ))
                .build();

        slotLayoutService.saveSlotLayout(floor.getId(), request);
        SlotLayoutResponse reloaded = slotLayoutService.getSlotLayout(floor.getId());

        assertThat(reloaded.getObjects()).hasSize(3);
        assertThat(reloaded.getObjects())
                .anySatisfy(object -> {
                    assertThat(object.getClassroomId()).isEqualTo(classroom.getId());
                    assertThat(object.getSlotRow()).isZero();
                    assertThat(object.getSlotColumn()).isZero();
                })
                .anySatisfy(object -> {
                    assertThat(object.getClassroomId()).isEqualTo(laboratory.getId());
                    assertThat(object.getSlotRow()).isZero();
                    assertThat(object.getSlotColumn()).isEqualTo(1);
                })
                .anySatisfy(object -> {
                    assertThat(object.getClassroomId()).isEqualTo(amphitheater.getId());
                    assertThat(object.getSlotRow()).isZero();
                    assertThat(object.getSlotColumn()).isEqualTo(2);
                });
    }

    @Test
    void saveSlotLayoutAllowsSwappingTwoPlacedTeachingSpaces() {
        SpaceObjectRequest first = slotObject(SpaceObjectType.CLASSROOM, classroom.getId(), 0, 0);
        SpaceObjectRequest second = slotObject(SpaceObjectType.LABORATORY, laboratory.getId(), 0, 1);
        slotLayoutService.saveSlotLayout(
                floor.getId(),
                SaveSlotLayoutRequest.builder()
                        .rows(3)
                        .columns(4)
                        .objects(List.of(first, second))
                        .build()
        );

        first.setSlotRow(0);
        first.setSlotColumn(1);
        second.setSlotRow(0);
        second.setSlotColumn(0);
        SlotLayoutResponse response = slotLayoutService.saveSlotLayout(
                floor.getId(),
                SaveSlotLayoutRequest.builder()
                        .rows(3)
                        .columns(4)
                        .objects(List.of(first, second))
                        .build()
        );

        assertThat(response.getObjects())
                .anySatisfy(object -> {
                    assertThat(object.getClassroomId()).isEqualTo(classroom.getId());
                    assertThat(object.getSlotRow()).isZero();
                    assertThat(object.getSlotColumn()).isEqualTo(1);
                })
                .anySatisfy(object -> {
                    assertThat(object.getClassroomId()).isEqualTo(laboratory.getId());
                    assertThat(object.getSlotRow()).isZero();
                    assertThat(object.getSlotColumn()).isZero();
                });
    }

    @Test
    void saveSlotLayoutRejectsMovingIntoOccupiedSlotWhenOccupantIsNotInRequest() {
        SpaceObjectRequest first = slotObject(SpaceObjectType.CLASSROOM, classroom.getId(), 0, 0);
        SpaceObjectRequest second = slotObject(SpaceObjectType.LABORATORY, laboratory.getId(), 0, 1);
        slotLayoutService.saveSlotLayout(
                floor.getId(),
                SaveSlotLayoutRequest.builder()
                        .rows(3)
                        .columns(4)
                        .objects(List.of(first, second))
                        .build()
        );

        first.setSlotRow(0);
        first.setSlotColumn(1);

        assertThatThrownBy(() -> slotLayoutService.saveSlotLayout(
                floor.getId(),
                SaveSlotLayoutRequest.builder()
                        .rows(3)
                        .columns(4)
                        .objects(List.of(first))
                        .build()
        ))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("slot zaten kullanılıyor");
    }

    @Test
    void saveSlotLayoutRemovePlacementKeepsPhysicalTeachingSpaceRecord() {
        SpaceObjectRequest object = slotObject(SpaceObjectType.LABORATORY, laboratory.getId(), 0, 0);
        slotLayoutService.saveSlotLayout(
                floor.getId(),
                SaveSlotLayoutRequest.builder()
                        .rows(3)
                        .columns(4)
                        .objects(List.of(object))
                        .build()
        );

        object.setSlotRow(null);
        object.setSlotColumn(null);
        SlotLayoutResponse response = slotLayoutService.saveSlotLayout(
                floor.getId(),
                SaveSlotLayoutRequest.builder()
                        .rows(3)
                        .columns(4)
                        .objects(List.of(object))
                        .build()
        );

        assertThat(classroomRepository.findById(laboratory.getId())).isPresent();
        assertThat(response.getObjects())
                .hasSize(1)
                .first()
                .satisfies(spaceObject -> {
                    assertThat(spaceObject.getClassroomId()).isEqualTo(laboratory.getId());
                    assertThat(spaceObject.getSlotRow()).isNull();
                    assertThat(spaceObject.getSlotColumn()).isNull();
                });
    }

    @Test
    void deleteUnassignedTeachingSpaceDeletesPhysicalRecordAndPlacement() {
        SpaceObjectRequest object = slotObject(SpaceObjectType.LABORATORY, laboratory.getId(), null, null);
        slotLayoutService.saveSlotLayout(
                floor.getId(),
                SaveSlotLayoutRequest.builder()
                        .rows(3)
                        .columns(4)
                        .objects(List.of(object))
                        .build()
        );

        slotLayoutService.deleteUnassignedTeachingSpace(floor.getId(), laboratory.getId());

        assertThat(classroomRepository.findById(laboratory.getId())).isEmpty();
        assertThat(spaceObjectRepository.findAllByFloorId(floor.getId()))
                .noneSatisfy(spaceObject -> assertThat(spaceObject.getClassroom().getId()).isEqualTo(laboratory.getId()));
    }

    @Test
    void deleteUnassignedTeachingSpaceRejectsPlacedRecord() {
        slotLayoutService.saveSlotLayout(
                floor.getId(),
                SaveSlotLayoutRequest.builder()
                        .rows(3)
                        .columns(4)
                        .objects(List.of(slotObject(SpaceObjectType.AMPHITHEATER, amphitheater.getId(), 0, 0)))
                        .build()
        );

        assertThatThrownBy(() -> slotLayoutService.deleteUnassignedTeachingSpace(floor.getId(), amphitheater.getId()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Önce slotu kaldırın");

        assertThat(classroomRepository.findById(amphitheater.getId())).isPresent();
    }

    @Test
    void deleteUnassignedTeachingSpaceRejectsWrongFloorRecord() {
        Floor otherFloor = new Floor();
        otherFloor.setName("Başka Kat");
        otherFloor.setLevel(3);
        otherFloor.setBuilding(floor.getBuilding());
        Floor savedOtherFloor = floorRepository.save(otherFloor);

        assertThatThrownBy(() -> slotLayoutService.deleteUnassignedTeachingSpace(savedOtherFloor.getId(), classroom.getId()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("bu kata ait değil");
    }

    @Test
    void saveSlotLayoutRejectsNonTeachingSpaceObjects() {
        SpaceObjectRequest object = slotObject(SpaceObjectType.MALE_WC, null, 0, 0);
        SaveSlotLayoutRequest request = SaveSlotLayoutRequest.builder()
                .rows(3)
                .columns(4)
                .objects(List.of(object))
                .build();

        assertThatThrownBy(() -> slotLayoutService.saveSlotLayout(floor.getId(), request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("sınıf, laboratuvar ve amfi");
    }

    @Test
    void saveSlotLayoutRejectsPartialSlotPlacement() {
        SpaceObjectRequest object = slotObject(SpaceObjectType.MALE_WC, null, 0, null);
        SaveSlotLayoutRequest request = SaveSlotLayoutRequest.builder()
                .rows(3)
                .columns(4)
                .objects(List.of(object))
                .build();

        assertThatThrownBy(() -> slotLayoutService.saveSlotLayout(floor.getId(), request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("birlikte");
    }

    @Test
    void createClassroomAndPlaceCreatesClassroomAndSlotPlacementAtomically() {
        SlotLayoutResponse response = slotLayoutService.createClassroomAndPlace(
                floor.getId(),
                CreateSlotClassroomRequest.builder()
                        .code("D103")
                        .name("Derslik 103")
                        .capacity(30)
                        .equipment("Projeksiyon")
                        .build()
        );

        Classroom created = classroomRepository.findByFloorIdAndCodeIgnoreCase(floor.getId(), "D103")
                .orElseThrow();

        assertThat(created.getType()).isEqualTo(ClassroomType.CLASSROOM);
        assertThat(created.getFloor().getId()).isEqualTo(floor.getId());
        assertThat(created.getEquipment()).isEqualTo("Projeksiyon");
        assertThat(spaceObjectRepository.findAllByFloorId(floor.getId()))
                .anySatisfy(spaceObject -> {
                    assertThat(spaceObject.getClassroom().getId()).isEqualTo(created.getId());
                    assertThat(spaceObject.getSlotRow()).isZero();
                    assertThat(spaceObject.getSlotColumn()).isZero();
                });
        assertThat(response.getObjects())
                .anySatisfy(object -> {
                    assertThat(object.getClassroomId()).isEqualTo(created.getId());
                    assertThat(object.getCode()).isEqualTo("D103");
                });
    }

    @Test
    void createClassroomAndPlaceRejectsDuplicateCodeOnSameFloor() {
        CreateSlotClassroomRequest request = CreateSlotClassroomRequest.builder()
                .code("D101")
                .name("Derslik 101")
                .capacity(30)
                .build();

        assertThatThrownBy(() -> slotLayoutService.createClassroomAndPlace(floor.getId(), request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("aynı koda");
    }

    @Test
    void createClassroomAndPlaceCreatesLaboratoryAndAmphitheaterSlots() {
        slotLayoutService.createClassroomAndPlace(
                floor.getId(),
                CreateSlotClassroomRequest.builder()
                        .type(ClassroomType.LABORATORY)
                        .code("LAB02")
                        .name("Bilgisayar Laboratuvarı")
                        .capacity(24)
                        .build()
        );

        SlotLayoutResponse response = slotLayoutService.createClassroomAndPlace(
                floor.getId(),
                CreateSlotClassroomRequest.builder()
                        .type(ClassroomType.AMPHITHEATER)
                        .code("AMF02")
                        .name("Büyük Amfi")
                        .capacity(120)
                        .build()
        );

        assertThat(response.getObjects())
                .filteredOn(object -> object.getCode().equals("LAB02") || object.getCode().equals("AMF02"))
                .hasSize(2)
                .extracting("type")
                .containsExactlyInAnyOrder(SpaceObjectType.LABORATORY, SpaceObjectType.AMPHITHEATER);
    }

    private Classroom createClassroom(String code, ClassroomType type) {
        Classroom classroomEntity = new Classroom();
        classroomEntity.setFloor(floor);
        classroomEntity.setCode(code);
        classroomEntity.setName(code);
        classroomEntity.setCapacity(40);
        classroomEntity.setType(type);
        return classroomRepository.save(classroomEntity);
    }

    private SpaceObjectRequest slotObject(
            SpaceObjectType type,
            UUID classroomId,
            Integer slotRow,
            Integer slotColumn
    ) {
        return SpaceObjectRequest.builder()
                .id(UUID.randomUUID())
                .classroomId(classroomId)
                .type(type)
                .status(SpaceObjectStatus.EMPTY)
                .label(type.name())
                .code(type.name())
                .capacity(20)
                .positionX(0.0)
                .positionY(0.0)
                .width(160.0)
                .height(100.0)
                .rotation(0.0)
                .slotRow(slotRow)
                .slotColumn(slotColumn)
                .build();
    }

    private void cleanDatabase() {
        spaceObjectRepository.deleteAll();
        slotLayoutRepository.deleteAll();
        floorLayoutRepository.deleteAll();
        classroomRepository.deleteAll();
        floorRepository.deleteAll();
        buildingRepository.deleteAll();
        facultyRepository.deleteAll();
    }
}
