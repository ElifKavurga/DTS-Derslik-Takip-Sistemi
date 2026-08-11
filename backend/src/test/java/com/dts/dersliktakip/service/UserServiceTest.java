package com.dts.dersliktakip.service;

import com.dts.dersliktakip.dto.CreateUserRequest;
import com.dts.dersliktakip.dto.CreateAcademicianUserRequest;
import com.dts.dersliktakip.dto.UpdateAcademicianUserRequest;
import com.dts.dersliktakip.dto.UserResponse;
import com.dts.dersliktakip.entity.Academician;
import com.dts.dersliktakip.entity.Department;
import com.dts.dersliktakip.entity.Faculty;
import com.dts.dersliktakip.entity.Role;
import com.dts.dersliktakip.entity.User;
import com.dts.dersliktakip.repository.AcademicianRepository;
import com.dts.dersliktakip.repository.DepartmentRepository;
import com.dts.dersliktakip.repository.FacultyRepository;
import com.dts.dersliktakip.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
class UserServiceTest {

    @Autowired
    private UserService userService;

    @Autowired
    private FacultyRepository facultyRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private AcademicianRepository academicianRepository;

    @Autowired
    private UserRepository userRepository;

    @BeforeEach
    void setUp() {
        academicianRepository.deleteAll();
        userRepository.deleteAll();
        departmentRepository.deleteAll();
        facultyRepository.deleteAll();
    }

    @Test
    void createUserWithAcademicianRoleCreatesMatchingAcademician() {
        Faculty faculty = new Faculty();
        faculty.setName("Mühendislik Fakültesi");
        faculty.setCode("MF");
        faculty = facultyRepository.save(faculty);

        Department department = new Department();
        department.setName("Bilgisayar Mühendisliği");
        department.setCode("BM");
        department.setFaculty(faculty);
        department = departmentRepository.save(department);

        CreateUserRequest request = new CreateUserRequest(
                "Ahmet",
                "Yılmaz",
                "ahmet@example.com",
                "password123",
                Set.of(Role.ACADEMICIAN),
                "+90 555 000 00 00",
                true,
                "Do\u00e7ent Dr.",
                faculty.getId(),
                department.getId(),
                null,
                null,
                null
        );

        UserResponse response = userService.createUser(request);

        assertThat(response.id()).isNotNull();
        assertThat(academicianRepository.findAll()).hasSize(1);

        Academician savedAcademician = academicianRepository.findAll().get(0);
        assertThat(savedAcademician.getFirstName()).isEqualTo("Ahmet");
        assertThat(savedAcademician.getLastName()).isEqualTo("Yılmaz");
        assertThat(savedAcademician.getEmail()).isEqualTo("ahmet@example.com");
        assertThat(savedAcademician.getFaculty().getId()).isEqualTo(faculty.getId());
        assertThat(savedAcademician.getDepartment().getId()).isEqualTo(department.getId());
        assertThat(academicianRepository.findByDepartmentId(department.getId())).hasSize(1);
    }

    @Test
    void departmentAdminListsOnlyOwnDepartmentAcademicians() {
        Faculty faculty = createFaculty("Muhendislik Fakultesi", "MF");
        Department departmentA = createDepartment("Bilgisayar Muhendisligi", "BM", faculty);
        Department departmentB = createDepartment("Elektrik-Elektronik Muhendisligi", "EEM", faculty);

        User departmentAdmin = departmentAdmin("admin@example.com", faculty.getName(), departmentA.getName());
        userRepository.save(departmentAdmin);
        userRepository.save(academicianUser("ahmet@example.com", "Ahmet", "Yilmaz", faculty.getName(), departmentA.getName(), "Do\u00e7ent Dr."));
        userRepository.save(academicianUser("mehmet@example.com", "Mehmet", "Demir", faculty.getName(), departmentB.getName(), "Profes\u00f6r Dr."));

        assertThat(userService.listManagedAcademicians(departmentAdmin, null, null))
                .extracting(UserResponse::email)
                .containsExactly("ahmet@example.com");
    }

    @Test
    void departmentAdminCreateAcademicianAssignsOwnDepartmentAndRole() {
        Faculty faculty = createFaculty("Muhendislik Fakultesi", "MF");
        Department department = createDepartment("Bilgisayar Muhendisligi", "BM", faculty);
        User departmentAdmin = userRepository.save(departmentAdmin("admin@example.com", faculty.getName(), department.getName()));

        UserResponse response = userService.createManagedAcademician(
                departmentAdmin,
                new CreateAcademicianUserRequest("Ayse", "Kaya", "ayse@example.com", "password123", "+90 555 000 00 00", "Do\u00e7ent Dr.")
        );

        assertThat(response.role()).isEqualTo(Role.ACADEMICIAN);
        assertThat(response.department()).isEqualTo(department.getName());
        assertThat(response.faculty()).isEqualTo(faculty.getName());
        assertThat(academicianRepository.findByEmail("ayse@example.com")).isPresent();
    }

    @Test
    void departmentAdminCreateAcademicianRejectsDuplicateEmailIgnoringCase() {
        Faculty faculty = createFaculty("Muhendislik Fakultesi", "MF");
        Department department = createDepartment("Bilgisayar Muhendisligi", "BM", faculty);
        User departmentAdmin = userRepository.save(departmentAdmin("admin@example.com", faculty.getName(), department.getName()));
        userRepository.save(academicianUser("ahmet@example.com", "Ahmet", "Yilmaz", faculty.getName(), department.getName(), "Do\u00e7ent Dr."));

        assertThatThrownBy(() -> userService.createManagedAcademician(
                departmentAdmin,
                new CreateAcademicianUserRequest("Ahmet", "Yilmaz", "AHMET@example.com", "password123", "+90 555 000 00 01", "Do\u00e7ent Dr.")
        )).isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("e-posta");
    }

    @Test
    void departmentAdminCreateAcademicianRejectsInvalidTitle() {
        Faculty faculty = createFaculty("Muhendislik Fakultesi", "MF");
        Department department = createDepartment("Bilgisayar Muhendisligi", "BM", faculty);
        User departmentAdmin = userRepository.save(departmentAdmin("admin@example.com", faculty.getName(), department.getName()));

        assertThatThrownBy(() -> userService.createManagedAcademician(
                departmentAdmin,
                new CreateAcademicianUserRequest("Ayse", "Kaya", "ayse@example.com", "password123", "+90 555 000 00 00", "prof hoca")
        )).isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("unvan");
    }

    @Test
    void departmentAdminCannotUpdateOtherDepartmentAcademician() {
        Faculty faculty = createFaculty("Muhendislik Fakultesi", "MF");
        Department departmentA = createDepartment("Bilgisayar Muhendisligi", "BM", faculty);
        Department departmentB = createDepartment("Elektrik-Elektronik Muhendisligi", "EEM", faculty);
        User departmentAdmin = userRepository.save(departmentAdmin("admin@example.com", faculty.getName(), departmentA.getName()));
        User otherDepartmentAcademician = userRepository.save(
                academicianUser("mehmet@example.com", "Mehmet", "Demir", faculty.getName(), departmentB.getName(), "Profes\u00f6r Dr.")
        );

        assertThatThrownBy(() -> userService.updateManagedAcademician(
                otherDepartmentAcademician.getId(),
                departmentAdmin,
                new UpdateAcademicianUserRequest("Mehmet", "Demir", "mehmet@example.com", "+90 555 000 00 02", "Do\u00e7ent Dr.", true)
        )).isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
    }

    private Faculty createFaculty(String name, String code) {
        Faculty faculty = new Faculty();
        faculty.setName(name);
        faculty.setCode(code);
        return facultyRepository.save(faculty);
    }

    private Department createDepartment(String name, String code, Faculty faculty) {
        Department department = new Department();
        department.setName(name);
        department.setCode(code);
        department.setFaculty(faculty);
        return departmentRepository.save(department);
    }

    private User departmentAdmin(String email, String faculty, String department) {
        User user = new User();
        user.setFirstName("Bolum");
        user.setLastName("Admini");
        user.setEmail(email);
        user.setPassword("password");
        user.setRoles(Set.of(Role.DEPARTMENT_ADMIN));
        user.setActive(true);
        user.setFaculty(faculty);
        user.setDepartment(department);
        return user;
    }

    private User academicianUser(String email, String firstName, String lastName, String faculty, String department, String title) {
        User user = new User();
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setEmail(email);
        user.setPassword("password");
        user.setRoles(Set.of(Role.ACADEMICIAN));
        user.setActive(true);
        user.setFaculty(faculty);
        user.setDepartment(department);
        user.setPhone("+90 555 000 00 00");
        user.setTitle(title);
        return user;
    }
}
