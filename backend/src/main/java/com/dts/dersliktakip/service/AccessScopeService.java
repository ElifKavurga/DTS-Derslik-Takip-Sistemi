package com.dts.dersliktakip.service;

import com.dts.dersliktakip.entity.Department;
import com.dts.dersliktakip.entity.Faculty;
import com.dts.dersliktakip.entity.Role;
import com.dts.dersliktakip.entity.User;
import com.dts.dersliktakip.repository.DepartmentRepository;
import com.dts.dersliktakip.repository.FacultyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AccessScopeService {

    private final FacultyRepository facultyRepository;
    private final DepartmentRepository departmentRepository;

    public boolean isSuperAdmin(User user) {
        Set<Role> roles = user.getRoles();
        return roles != null && roles.contains(Role.SUPER_ADMIN);
    }

    public Department requireDepartmentScope(User user) {
        Faculty faculty = requireFacultyScope(user);
        String departmentName = user.getDepartment();
        if (!StringUtils.hasText(departmentName)) {
            throw new AccessDeniedException("Bolum yetkisi bulunamadi.");
        }

        return departmentRepository.findAll().stream()
                .filter(department -> department.getFaculty() != null
                        && department.getFaculty().getId().equals(faculty.getId())
                        && department.getName().equalsIgnoreCase(departmentName))
                .findFirst()
                .orElseThrow(() -> new AccessDeniedException("Bolum yetkisi bulunamadi."));
    }

    public Faculty requireFacultyScope(User user) {
        String facultyName = user.getFaculty();
        if (!StringUtils.hasText(facultyName)) {
            throw new AccessDeniedException("Fakulte yetkisi bulunamadi.");
        }

        return facultyRepository.findAll().stream()
                .filter(faculty -> faculty.getName().equalsIgnoreCase(facultyName))
                .findFirst()
                .orElseThrow(() -> new AccessDeniedException("Fakulte yetkisi bulunamadi."));
    }

    public void assertDepartmentAccess(User user, UUID departmentId) {
        if (isSuperAdmin(user)) {
            return;
        }
        Department scopedDepartment = requireDepartmentScope(user);
        if (!scopedDepartment.getId().equals(departmentId)) {
            throw new AccessDeniedException("Bu bolum icin yetkiniz yok.");
        }
    }

    public void assertFacultyAccess(User user, UUID facultyId) {
        if (isSuperAdmin(user)) {
            return;
        }
        Faculty scopedFaculty = requireFacultyScope(user);
        if (!scopedFaculty.getId().equals(facultyId)) {
            throw new AccessDeniedException("Bu fakulte icin yetkiniz yok.");
        }
    }
}
