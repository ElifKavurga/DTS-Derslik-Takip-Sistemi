package com.dts.dersliktakip.service;

import com.dts.dersliktakip.dto.CreateFacultyRequest;
import com.dts.dersliktakip.dto.FacultyDetailResponse;
import com.dts.dersliktakip.dto.FacultyResponse;
import com.dts.dersliktakip.dto.UpdateFacultyRequest;
import com.dts.dersliktakip.entity.Faculty;
import com.dts.dersliktakip.entity.Role;
import com.dts.dersliktakip.entity.User;
import com.dts.dersliktakip.exception.ResourceNotFoundException;
import com.dts.dersliktakip.mapper.FacultyMapper;
import com.dts.dersliktakip.repository.BuildingRepository;
import com.dts.dersliktakip.repository.ClassroomRepository;
import com.dts.dersliktakip.repository.DepartmentRepository;
import com.dts.dersliktakip.repository.FacultyRepository;
import com.dts.dersliktakip.repository.FloorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FacultyService {

    private final FacultyRepository facultyRepository;
    private final BuildingRepository buildingRepository;
    private final DepartmentRepository departmentRepository;
    private final FloorRepository floorRepository;
    private final ClassroomRepository classroomRepository;
    private final FacultyMapper facultyMapper;
    private final AccessScopeService accessScopeService;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public List<FacultyResponse> getAllFaculties() {
        List<Faculty> faculties = facultyRepository.findAll();
        return facultyMapper.toResponseList(faculties).stream()
                .map(this::enrichResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<FacultyResponse> getVisibleFaculties(User currentUser) {
        List<Faculty> faculties = accessScopeService.isSuperAdmin(currentUser)
                ? facultyRepository.findAll()
                : List.of(accessScopeService.requireFacultyScope(currentUser));

        return facultyMapper.toResponseList(faculties).stream()
                .map(this::enrichResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public FacultyResponse getFacultyById(UUID id) {
        Faculty faculty = facultyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Fakülte bulunamadı."));
        return enrichResponse(facultyMapper.toResponse(faculty));
    }

    @Transactional(readOnly = true)
    public FacultyDetailResponse getFacultyDetailById(UUID id) {
        Faculty faculty = facultyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Fakülte bulunamadı."));
        FacultyDetailResponse response = facultyMapper.toDetailResponse(faculty);
        response.setTotalBuildings(buildingRepository.countByFacultyId(id));
        response.setTotalFloors(floorRepository.countByBuildingFacultyId(id));
        response.setTotalClassrooms(classroomRepository.countByFloorBuildingFacultyId(id));
        return response;
    }

    @Transactional
    public FacultyResponse createFaculty(CreateFacultyRequest request) {
        if (facultyRepository.existsByName(request.getName())) {
            throw new IllegalArgumentException("Aynı isimde başka bir fakülte zaten mevcuttur.");
        }
        if (facultyRepository.existsByCode(request.getCode())) {
            throw new IllegalArgumentException("Aynı kodda başka bir fakülte zaten mevcuttur.");
        }

        Faculty faculty = facultyMapper.toEntity(request);
        Faculty savedFaculty = facultyRepository.save(faculty);
        FacultyResponse response = enrichResponse(facultyMapper.toResponse(savedFaculty));
        notificationService.createForRole(
                Role.SUPER_ADMIN,
                "Yeni fakülte oluşturuldu",
                savedFaculty.getName() + " sisteme eklendi.",
                "/super-admin/fakulteler/" + savedFaculty.getId()
        );
        return response;
    }

    @Transactional
    public FacultyResponse updateFaculty(UUID id, UpdateFacultyRequest request) {
        Faculty faculty = facultyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Fakülte bulunamadı."));

        if (facultyRepository.existsByNameAndIdNot(request.getName(), id)) {
            throw new IllegalArgumentException("Aynı isimde başka bir fakülte zaten mevcuttur.");
        }
        if (facultyRepository.existsByCodeAndIdNot(request.getCode(), id)) {
            throw new IllegalArgumentException("Aynı kodda başka bir fakülte zaten mevcuttur.");
        }

        facultyMapper.updateEntityFromRequest(request, faculty);
        Faculty updatedFaculty = facultyRepository.save(faculty);
        return enrichResponse(facultyMapper.toResponse(updatedFaculty));
    }

    @Transactional
    public void deleteFaculty(UUID id) {
        if (!facultyRepository.existsById(id)) {
            throw new ResourceNotFoundException("Fakülte bulunamadı.");
        }

        if (buildingRepository.existsByFacultyId(id)) {
            throw new IllegalArgumentException("Bu fakülteye bağlı binalar bulunduğundan silinemez.");
        }

        if (departmentRepository.existsByFacultyId(id)) {
            throw new IllegalArgumentException("Bu fakülteye bağlı bölümler bulunduğundan silinemez.");
        }

        facultyRepository.deleteById(id);
    }

    private FacultyResponse enrichResponse(FacultyResponse response) {
        if (response == null) return null;
        UUID id = response.getId();
        response.setTotalBuildings(buildingRepository.countByFacultyId(id));
        response.setTotalFloors(floorRepository.countByBuildingFacultyId(id));
        response.setTotalClassrooms(classroomRepository.countByFloorBuildingFacultyId(id));
        return response;
    }
}
