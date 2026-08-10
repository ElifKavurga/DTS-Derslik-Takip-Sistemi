package com.dts.dersliktakip.service;

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
    void saveSlotLayoutRejectsNonClassroomObjects() {
        SpaceObjectRequest object = slotObject(SpaceObjectType.LABORATORY, laboratory.getId(), 0, 0);
        SaveSlotLayoutRequest request = SaveSlotLayoutRequest.builder()
                .rows(3)
                .columns(4)
                .objects(List.of(object))
                .build();

        assertThatThrownBy(() -> slotLayoutService.saveSlotLayout(floor.getId(), request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("yalnızca sınıflar");
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
