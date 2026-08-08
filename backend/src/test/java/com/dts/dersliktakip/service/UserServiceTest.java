package com.dts.dersliktakip.service;

import com.dts.dersliktakip.dto.CreateUserRequest;
import com.dts.dersliktakip.dto.UserResponse;
import com.dts.dersliktakip.entity.Academician;
import com.dts.dersliktakip.entity.Department;
import com.dts.dersliktakip.entity.Faculty;
import com.dts.dersliktakip.entity.Role;
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
                "Doç. Dr.",
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
}
