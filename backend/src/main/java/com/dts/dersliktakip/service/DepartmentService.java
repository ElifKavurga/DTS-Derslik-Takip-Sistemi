package com.dts.dersliktakip.service;

import com.dts.dersliktakip.dto.CreateDepartmentRequest;
import com.dts.dersliktakip.dto.DepartmentResponse;
import com.dts.dersliktakip.dto.UpdateDepartmentRequest;
import com.dts.dersliktakip.entity.Department;
import com.dts.dersliktakip.entity.Faculty;
import com.dts.dersliktakip.entity.User;
import com.dts.dersliktakip.exception.ResourceNotFoundException;
import com.dts.dersliktakip.mapper.DepartmentMapper;
import com.dts.dersliktakip.repository.AcademicianRepository;
import com.dts.dersliktakip.repository.CourseRepository;
import com.dts.dersliktakip.repository.DepartmentRepository;
import com.dts.dersliktakip.repository.FacultyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final FacultyRepository facultyRepository;
    private final AcademicianRepository academicianRepository;
    private final CourseRepository courseRepository;
    private final DepartmentMapper departmentMapper;
    private final AccessScopeService accessScopeService;

    @Transactional(readOnly = true)
    public List<DepartmentResponse> getVisibleDepartments(User currentUser) {
        List<Department> departments = accessScopeService.isSuperAdmin(currentUser)
                ? departmentRepository.findAll()
                : List.of(accessScopeService.requireDepartmentScope(currentUser));

        return departments.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<DepartmentResponse> getDepartmentsByFaculty(UUID facultyId, User currentUser) {
        List<Department> departments;
        if (accessScopeService.isSuperAdmin(currentUser)) {
            departments = departmentRepository.findByFacultyId(facultyId);
        } else {
            accessScopeService.assertFacultyAccess(currentUser, facultyId);
            departments = List.of(accessScopeService.requireDepartmentScope(currentUser));
        }

        return departments.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public DepartmentResponse getDepartmentById(UUID id, User currentUser) {
        if (!accessScopeService.isSuperAdmin(currentUser)) {
            accessScopeService.assertDepartmentAccess(currentUser, id);
        }

        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("BÃ¶lÃ¼m bulunamadÄ±."));

        return toResponse(department);
    }

    @Transactional
    public DepartmentResponse createDepartment(CreateDepartmentRequest request) {
        Faculty faculty = facultyRepository.findById(request.facultyId())
                .orElseThrow(() -> new ResourceNotFoundException("Fakülte bulunamadı."));

        validateUniqueCreate(request.facultyId(), request.name(), request.code());

        Department department = new Department();
        department.setName(request.name());
        department.setCode(request.code());
        department.setFaculty(faculty);

        return toResponse(departmentRepository.save(department));
    }

    @Transactional
    public DepartmentResponse updateDepartment(UUID id, UpdateDepartmentRequest request) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bölüm bulunamadı."));
        Faculty faculty = facultyRepository.findById(request.facultyId())
                .orElseThrow(() -> new ResourceNotFoundException("Fakülte bulunamadı."));

        validateUniqueUpdate(id, request.facultyId(), request.name(), request.code());

        department.setName(request.name());
        department.setCode(request.code());
        department.setFaculty(faculty);

        return toResponse(departmentRepository.save(department));
    }

    @Transactional
    public void deleteDepartment(UUID id) {
        if (!departmentRepository.existsById(id)) {
            throw new ResourceNotFoundException("Bölüm bulunamadı.");
        }
        if (academicianRepository.existsByDepartment_Id(id)) {
            throw new IllegalArgumentException("Bu bölüme bağlı akademisyenler bulunduğundan silinemez.");
        }
        if (courseRepository.existsByDepartment_Id(id)) {
            throw new IllegalArgumentException("Bu bölüme bağlı dersler bulunduğundan silinemez.");
        }

        departmentRepository.deleteById(id);
    }

    private void validateUniqueCreate(UUID facultyId, String name, String code) {
        if (departmentRepository.existsByFaculty_IdAndCodeIgnoreCase(facultyId, code)) {
            throw new IllegalArgumentException("Bu bölüm kodu zaten kullanılıyor.");
        }
        if (departmentRepository.existsByFaculty_IdAndNameIgnoreCase(facultyId, name)) {
            throw new IllegalArgumentException("Bu bölüm adı zaten kullanılıyor.");
        }
    }

    private void validateUniqueUpdate(UUID id, UUID facultyId, String name, String code) {
        if (departmentRepository.existsByFaculty_IdAndCodeIgnoreCaseAndIdNot(facultyId, code, id)) {
            throw new IllegalArgumentException("Bu bölüm kodu zaten kullanılıyor.");
        }
        if (departmentRepository.existsByFaculty_IdAndNameIgnoreCaseAndIdNot(facultyId, name, id)) {
            throw new IllegalArgumentException("Bu bölüm adı zaten kullanılıyor.");
        }
    }

    private DepartmentResponse toResponse(Department department) {
        DepartmentResponse base = departmentMapper.toResponse(department);
        UUID departmentId = department.getId();
        return new DepartmentResponse(
                base.id(),
                base.name(),
                base.code(),
                base.facultyId(),
                base.facultyName(),
                academicianRepository.countByDepartment_Id(departmentId),
                courseRepository.countByDepartment_Id(departmentId)
        );
    }
}
