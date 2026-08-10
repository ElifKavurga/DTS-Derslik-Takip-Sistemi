package com.dts.dersliktakip.service;

import com.dts.dersliktakip.dto.SaveFloorLayoutRequest;
import com.dts.dersliktakip.dto.SpaceObjectRequest;
import com.dts.dersliktakip.dto.FloorDetailResponse;
import com.dts.dersliktakip.entity.Building;
import com.dts.dersliktakip.entity.Classroom;
import com.dts.dersliktakip.entity.ClassroomType;
import com.dts.dersliktakip.entity.Faculty;
import com.dts.dersliktakip.entity.Floor;
import com.dts.dersliktakip.entity.SpaceObjectStatus;
import com.dts.dersliktakip.entity.SpaceObjectType;
import com.dts.dersliktakip.repository.BuildingRepository;
import com.dts.dersliktakip.repository.ClassroomRepository;
import com.dts.dersliktakip.repository.FacultyRepository;
import com.dts.dersliktakip.repository.FloorLayoutRepository;
import com.dts.dersliktakip.repository.FloorRepository;
import com.dts.dersliktakip.repository.SpaceObjectRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
class FloorLayoutServiceTest {

    @Autowired
    private FloorLayoutService floorLayoutService;

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

    private Floor floorA;
    private Floor floorB;
    private Classroom classroomA;
    private Classroom laboratoryB;

    @BeforeEach
    void setUp() {
        cleanDatabase();

        Faculty faculty = new Faculty();
        faculty.setName("Validation Fakültesi");
        faculty.setCode("VAL");
        faculty = facultyRepository.save(faculty);

        Building building = new Building();
        building.setName("Validation Binası");
        building.setCode("VAL-B");
        building.setFaculty(faculty);
        building = buildingRepository.save(building);

        floorA = createFloor(building, "Zemin Kat", 0);
        floorB = createFloor(building, "Birinci Kat", 1);
        classroomA = createClassroom(floorA, "D101", ClassroomType.CLASSROOM);
        laboratoryB = createClassroom(floorB, "LAB201", ClassroomType.LABORATORY);
    }

    @AfterEach
    void tearDown() {
        cleanDatabase();
    }

    @Test
    void saveLayoutRejectsClassroomFromDifferentFloor() {
        SaveFloorLayoutRequest request = layoutRequest(List.of(spaceObject(
                SpaceObjectType.LABORATORY,
                laboratoryB.getId(),
                160.0,
                100.0
        )));

        assertThatThrownBy(() -> floorLayoutService.saveLayout(floorA.getId(), request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("bu kata ait değil");
    }

    @Test
    void saveLayoutRejectsMissingClassroomId() {
        SaveFloorLayoutRequest request = layoutRequest(List.of(spaceObject(
                SpaceObjectType.CLASSROOM,
                UUID.randomUUID(),
                160.0,
                100.0
        )));

        assertThatThrownBy(() -> floorLayoutService.saveLayout(floorA.getId(), request))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Derslik bulunamadı");
    }

    @Test
    void saveLayoutRejectsClassroomTypeMismatch() {
        SaveFloorLayoutRequest request = layoutRequest(List.of(spaceObject(
                SpaceObjectType.LABORATORY,
                classroomA.getId(),
                160.0,
                100.0
        )));

        assertThatThrownBy(() -> floorLayoutService.saveLayout(floorA.getId(), request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("uyumlu değil");
    }

    @Test
    void saveLayoutRejectsDuplicateClassroomPlacement() {
        SaveFloorLayoutRequest request = layoutRequest(List.of(
                spaceObject(SpaceObjectType.CLASSROOM, classroomA.getId(), 160.0, 100.0),
                spaceObject(SpaceObjectType.CLASSROOM, classroomA.getId(), 180.0, 120.0)
        ));

        assertThatThrownBy(() -> floorLayoutService.saveLayout(floorA.getId(), request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("birden fazla kez");
    }

    @Test
    void saveLayoutRejectsNonClassroomObjectWithClassroomId() {
        SaveFloorLayoutRequest request = layoutRequest(List.of(spaceObject(
                SpaceObjectType.MALE_WC,
                classroomA.getId(),
                100.0,
                80.0
        )));

        assertThatThrownBy(() -> floorLayoutService.saveLayout(floorA.getId(), request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("derslik kaydına bağlanamaz");
    }

    @Test
    void saveLayoutRejectsInvalidDimensions() {
        SaveFloorLayoutRequest request = layoutRequest(List.of(spaceObject(
                SpaceObjectType.MALE_WC,
                null,
                -10.0,
                80.0
        )));

        assertThatThrownBy(() -> floorLayoutService.saveLayout(floorA.getId(), request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("pozitif");
    }

    @Test
    void saveLayoutAllowsNonClassroomObjectWithoutClassroomId() {
        SaveFloorLayoutRequest request = layoutRequest(List.of(spaceObject(
                SpaceObjectType.MALE_WC,
                null,
                100.0,
                80.0
        )));

        floorLayoutService.saveLayout(floorA.getId(), request);

        assertThat(spaceObjectRepository.findAllByFloorId(floorA.getId()))
                .hasSize(1)
                .first()
                .satisfies(spaceObject -> {
                    assertThat(spaceObject.getClassroom()).isNull();
                    assertThat(spaceObject.getWidth()).isEqualTo(100.0);
                    assertThat(spaceObject.getHeight()).isEqualTo(80.0);
                });
    }

    @Test
    void saveLayoutPreservesMetadataOnReload() {
        SpaceObjectRequest requestObject = spaceObject(SpaceObjectType.CLASSROOM, classroomA.getId(), 180.0, 120.0);
        requestObject.setMetadataJson("{\"equipment\":{\"hasAirConditioning\":true,\"hasProjector\":true},\"isLocked\":true}");

        floorLayoutService.saveLayout(floorA.getId(), layoutRequest(List.of(requestObject)));

        FloorDetailResponse detail = floorLayoutService.getFloorDetail(floorA.getId());

        assertThat(detail.getObjects())
                .hasSize(1)
                .first()
                .satisfies(spaceObject -> {
                    assertThat(spaceObject.getClassroomId()).isEqualTo(classroomA.getId());
                    assertThat(spaceObject.getMetadataJson()).contains("\"hasAirConditioning\":true");
                    assertThat(spaceObject.getMetadataJson()).contains("\"isLocked\":true");
                });
    }

    @Test
    void saveLayoutKeepsFloorLayoutsSeparated() {
        SpaceObjectRequest floorAObject = spaceObject(SpaceObjectType.CLASSROOM, classroomA.getId(), 160.0, 100.0);
        floorAObject.setPositionX(360.0);
        floorAObject.setPositionY(260.0);

        SpaceObjectRequest floorBObject = spaceObject(SpaceObjectType.LABORATORY, laboratoryB.getId(), 180.0, 120.0);
        floorBObject.setPositionX(40.0);
        floorBObject.setPositionY(60.0);

        floorLayoutService.saveLayout(floorA.getId(), layoutRequest(List.of(floorAObject)));
        floorLayoutService.saveLayout(floorB.getId(), layoutRequest(List.of(floorBObject)));

        FloorDetailResponse floorADetail = floorLayoutService.getFloorDetail(floorA.getId());
        FloorDetailResponse floorBDetail = floorLayoutService.getFloorDetail(floorB.getId());

        assertThat(floorADetail.getObjects())
                .hasSize(1)
                .first()
                .satisfies(spaceObject -> {
                    assertThat(spaceObject.getClassroomId()).isEqualTo(classroomA.getId());
                    assertThat(spaceObject.getPositionX()).isEqualTo(360.0);
                    assertThat(spaceObject.getPositionY()).isEqualTo(260.0);
                });
        assertThat(floorBDetail.getObjects())
                .hasSize(1)
                .first()
                .satisfies(spaceObject -> {
                    assertThat(spaceObject.getClassroomId()).isEqualTo(laboratoryB.getId());
                    assertThat(spaceObject.getPositionX()).isEqualTo(40.0);
                    assertThat(spaceObject.getPositionY()).isEqualTo(60.0);
                });
    }

    @Test
    void saveLayoutRollsBackWhenReplacementPayloadIsInvalid() {
        SpaceObjectRequest validObject = spaceObject(SpaceObjectType.CLASSROOM, classroomA.getId(), 160.0, 100.0);
        validObject.setPositionX(320.0);
        validObject.setPositionY(220.0);
        SaveFloorLayoutRequest initialRequest = layoutRequest(List.of(validObject));
        initialRequest.setBackgroundX(12.0);
        initialRequest.setBackgroundY(24.0);

        floorLayoutService.saveLayout(floorA.getId(), initialRequest);

        SaveFloorLayoutRequest invalidRequest = layoutRequest(List.of(spaceObject(
                SpaceObjectType.MALE_WC,
                classroomA.getId(),
                100.0,
                80.0
        )));
        invalidRequest.setBackgroundX(999.0);

        assertThatThrownBy(() -> floorLayoutService.saveLayout(floorA.getId(), invalidRequest))
                .isInstanceOf(IllegalArgumentException.class);

        FloorDetailResponse detail = floorLayoutService.getFloorDetail(floorA.getId());

        assertThat(detail.getBackgroundX()).isEqualTo(12.0);
        assertThat(detail.getBackgroundY()).isEqualTo(24.0);
        assertThat(detail.getObjects())
                .hasSize(1)
                .first()
                .satisfies(spaceObject -> {
                    assertThat(spaceObject.getClassroomId()).isEqualTo(classroomA.getId());
                    assertThat(spaceObject.getPositionX()).isEqualTo(320.0);
                    assertThat(spaceObject.getPositionY()).isEqualTo(220.0);
                });
    }

    private Floor createFloor(Building building, String name, int level) {
        Floor floor = new Floor();
        floor.setName(name);
        floor.setLevel(level);
        floor.setBuilding(building);
        return floorRepository.save(floor);
    }

    private Classroom createClassroom(Floor floor, String code, ClassroomType type) {
        Classroom classroom = new Classroom();
        classroom.setFloor(floor);
        classroom.setCode(code);
        classroom.setName(code);
        classroom.setCapacity(40);
        classroom.setType(type);
        return classroomRepository.save(classroom);
    }

    private SaveFloorLayoutRequest layoutRequest(List<SpaceObjectRequest> objects) {
        return SaveFloorLayoutRequest.builder()
                .backgroundX(0.0)
                .backgroundY(0.0)
                .backgroundOpacity(0.35)
                .backgroundLocked(false)
                .viewportX(0.0)
                .viewportY(0.0)
                .viewportZoom(1.0)
                .objects(objects)
                .build();
    }

    private SpaceObjectRequest spaceObject(
            SpaceObjectType type,
            UUID classroomId,
            Double width,
            Double height
    ) {
        return SpaceObjectRequest.builder()
                .id(UUID.randomUUID())
                .classroomId(classroomId)
                .type(type)
                .status(SpaceObjectStatus.EMPTY)
                .label(type.name())
                .code(type.name())
                .capacity(20)
                .positionX(120.0)
                .positionY(80.0)
                .width(width)
                .height(height)
                .rotation(0.0)
                .build();
    }

    private void cleanDatabase() {
        spaceObjectRepository.deleteAll();
        floorLayoutRepository.deleteAll();
        classroomRepository.deleteAll();
        floorRepository.deleteAll();
        buildingRepository.deleteAll();
        facultyRepository.deleteAll();
    }
}
