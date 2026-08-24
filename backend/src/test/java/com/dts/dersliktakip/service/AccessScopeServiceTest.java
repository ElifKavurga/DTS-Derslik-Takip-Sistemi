package com.dts.dersliktakip.service;

import com.dts.dersliktakip.entity.Department;
import com.dts.dersliktakip.entity.Faculty;
import com.dts.dersliktakip.entity.Role;
import com.dts.dersliktakip.entity.User;
import com.dts.dersliktakip.repository.DepartmentRepository;
import com.dts.dersliktakip.repository.FacultyRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AccessScopeServiceTest {

    @Mock
    private FacultyRepository facultyRepository;

    @Mock
    private DepartmentRepository departmentRepository;

    @InjectMocks
    private AccessScopeService accessScopeService;

    @Test
    void isSuperAdminReturnsTrueWhenRoleIsPresent() {
        // Arrange: AUTH-02, TD-VALID-001
        User user = user(Role.SUPER_ADMIN, null, null);

        // Act / Assert
        assertThat(accessScopeService.isSuperAdmin(user)).isTrue();
    }

    @Test
    void requireDepartmentScopeReturnsMatchingDepartmentIgnoringCase() {
        // Arrange: AUTH-03, TD-VALID-002
        Faculty faculty = faculty("Muhendislik Fakultesi");
        Department department = department("Bilgisayar Muhendisligi", faculty);
        User user = user(Role.DEPARTMENT_ADMIN, "muhendislik fakultesi", "bilgisayar muhendisligi");

        when(facultyRepository.findAll()).thenReturn(List.of(faculty));
        when(departmentRepository.findAll()).thenReturn(List.of(department));

        // Act
        Department result = accessScopeService.requireDepartmentScope(user);

        // Assert
        assertThat(result).isSameAs(department);
    }

    @Test
    void requireDepartmentScopeRejectsUserWithoutDepartmentClaim() {
        // Arrange: AUTH-03, TD-INVALID-010
        Faculty faculty = faculty("Muhendislik Fakultesi");
        User user = user(Role.DEPARTMENT_ADMIN, faculty.getName(), null);

        when(facultyRepository.findAll()).thenReturn(List.of(faculty));

        // Act / Assert
        assertThatThrownBy(() -> accessScopeService.requireDepartmentScope(user))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage("Bolum yetkisi bulunamadi.");
    }

    @Test
    void assertFacultyAccessAllowsSuperAdminWithoutScopeLookup() {
        // Arrange: AUTH-02, TD-VALID-001
        User user = user(Role.SUPER_ADMIN, null, null);

        // Act / Assert
        accessScopeService.assertFacultyAccess(user, UUID.randomUUID());
    }

    @Test
    void assertDepartmentAccessRejectsScopeMismatch() {
        // Arrange: AUTH-03, TD-INVALID-010
        Faculty faculty = faculty("Muhendislik Fakultesi");
        Department scopedDepartment = department("Bilgisayar Muhendisligi", faculty);
        User user = user(Role.DEPARTMENT_ADMIN, faculty.getName(), scopedDepartment.getName());

        when(facultyRepository.findAll()).thenReturn(List.of(faculty));
        when(departmentRepository.findAll()).thenReturn(List.of(scopedDepartment));

        // Act / Assert
        assertThatThrownBy(() -> accessScopeService.assertDepartmentAccess(user, UUID.randomUUID()))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage("Bu bolum icin yetkiniz yok.");
    }

    private static User user(Role role, String faculty, String department) {
        User user = new User();
        user.setRoles(Set.of(role));
        user.setFaculty(faculty);
        user.setDepartment(department);
        return user;
    }

    private static Faculty faculty(String name) {
        Faculty faculty = new Faculty();
        faculty.setId(UUID.randomUUID());
        faculty.setName(name);
        faculty.setCode("MF");
        return faculty;
    }

    private static Department department(String name, Faculty faculty) {
        Department department = new Department();
        department.setId(UUID.randomUUID());
        department.setName(name);
        department.setCode("CENG");
        department.setFaculty(faculty);
        return department;
    }
}
