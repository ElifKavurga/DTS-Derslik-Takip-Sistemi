package com.dts.dersliktakip.service;

import com.dts.dersliktakip.dto.CreateUserRequest;
import com.dts.dersliktakip.dto.UpdateUserRequest;
import com.dts.dersliktakip.dto.UserResponse;
import com.dts.dersliktakip.entity.Academician;
import com.dts.dersliktakip.entity.Department;
import com.dts.dersliktakip.entity.Faculty;
import com.dts.dersliktakip.entity.Role;
import com.dts.dersliktakip.entity.User;
import com.dts.dersliktakip.mapper.UserMapper;
import com.dts.dersliktakip.repository.AcademicianRepository;
import com.dts.dersliktakip.repository.DepartmentRepository;
import com.dts.dersliktakip.repository.FacultyRepository;
import com.dts.dersliktakip.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final AcademicianRepository academicianRepository;
    private final FacultyRepository facultyRepository;
    private final DepartmentRepository departmentRepository;

    @Transactional(readOnly = true)
    public List<UserResponse> listUsers() {
        return userRepository.findAll()
                .stream()
                .map(userMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public UserResponse getUser(UUID id) {
        User user = userRepository.findById(id).orElseThrow(() -> new com.dts.dersliktakip.exception.UserNotFoundException(id));
        return userMapper.toResponse(user);
    }

    @Transactional
    public UserResponse createUser(CreateUserRequest request) {
        userRepository.findByEmail(request.email()).ifPresent(u -> { throw new IllegalArgumentException("Email already in use"); });
        User user = new User();
        user.setFirstName(request.firstName());
        user.setLastName(request.lastName());
        user.setEmail(request.email());
        user.setPassword(passwordEncoder.encode(request.password()));
        if (request.roles() != null) user.setRoles(request.roles());
        user.setPhone(request.phone());
        user.setActive(request.active());
        user.setTitle(request.title());
        user.setFaculty(resolveFacultyName(request.facultyId(), request.faculty()));
        user.setDepartment(resolveDepartmentName(request.departmentId(), request.department()));
        user.setOffice(request.office());
        User saved = userRepository.save(user);
        syncAcademicianRecord(saved, request.facultyId(), request.departmentId());
        return userMapper.toResponse(saved);
    }

    @Transactional
    public UserResponse updateUser(UUID id, UpdateUserRequest request) {
        User user = userRepository.findById(id).orElseThrow(() -> new com.dts.dersliktakip.exception.UserNotFoundException(id));
        if (!user.getEmail().equals(request.email())) {
            userRepository.findByEmail(request.email()).ifPresent(u -> { throw new IllegalArgumentException("Email already in use"); });
            user.setEmail(request.email());
        }
        user.setFirstName(request.firstName());
        user.setLastName(request.lastName());
        if (request.roles() != null) user.setRoles(request.roles());
        user.setPhone(request.phone());
        user.setActive(request.active());
        user.setTitle(request.title());
        user.setFaculty(resolveFacultyName(request.facultyId(), request.faculty()));
        user.setDepartment(resolveDepartmentName(request.departmentId(), request.department()));
        user.setOffice(request.office());
        User saved = userRepository.save(user);
        syncAcademicianRecord(saved, request.facultyId(), request.departmentId());
        return userMapper.toResponse(saved);
    }

    private String resolveFacultyName(UUID facultyId, String fallbackFaculty) {
        if (facultyId == null) {
            return fallbackFaculty;
        }
        return facultyRepository.findById(facultyId)
                .map(Faculty::getName)
                .orElse(fallbackFaculty);
    }

    private String resolveDepartmentName(UUID departmentId, String fallbackDepartment) {
        if (departmentId == null) {
            return fallbackDepartment;
        }
        return departmentRepository.findById(departmentId)
                .map(Department::getName)
                .orElse(fallbackDepartment);
    }

    @Transactional
    public void deleteUser(UUID id) {
        User user = userRepository.findById(id).orElseThrow(() -> new com.dts.dersliktakip.exception.UserNotFoundException(id));
        userRepository.delete(user);
    }

    private void syncAcademicianRecord(User user, UUID facultyId, UUID departmentId) {
        Set<Role> roles = user.getRoles();
        boolean isAcademician = roles != null && roles.contains(Role.ACADEMICIAN);
        if (!isAcademician) {
            return;
        }

        Optional<Faculty> matchingFaculty = facultyId != null
                ? facultyRepository.findById(facultyId)
                : facultyRepository.findAll().stream()
                        .filter(faculty -> StringUtils.hasText(user.getFaculty())
                                && faculty.getName().equalsIgnoreCase(user.getFaculty()))
                        .findFirst();

        if (matchingFaculty.isEmpty()) {
            return;
        }

        Optional<Department> matchingDepartment = departmentId != null
                ? departmentRepository.findById(departmentId)
                        .filter(department -> department.getFaculty() != null
                                && department.getFaculty().getId().equals(matchingFaculty.get().getId()))
                : departmentRepository.findAll().stream()
                        .filter(department -> StringUtils.hasText(user.getDepartment())
                                && department.getName().equalsIgnoreCase(user.getDepartment())
                                && department.getFaculty() != null
                                && department.getFaculty().getId().equals(matchingFaculty.get().getId()))
                        .findFirst();

        if (matchingDepartment.isEmpty()) {
            return;
        }

        Academician academician = academicianRepository.findByEmail(user.getEmail()).orElseGet(Academician::new);
        academician.setFirstName(user.getFirstName());
        academician.setLastName(user.getLastName());
        academician.setEmail(user.getEmail());
        academician.setPhone(StringUtils.hasText(user.getPhone()) ? user.getPhone() : "00000000000");
        academician.setTitle(StringUtils.hasText(user.getTitle()) ? user.getTitle() : "Dr.");
        academician.setFaculty(matchingFaculty.get());
        academician.setDepartment(matchingDepartment.get());
        academicianRepository.save(academician);
    }
}
