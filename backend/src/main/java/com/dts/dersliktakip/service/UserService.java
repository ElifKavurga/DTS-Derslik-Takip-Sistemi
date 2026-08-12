package com.dts.dersliktakip.service;

import com.dts.dersliktakip.dto.CreateUserRequest;
import com.dts.dersliktakip.dto.CreateAcademicianUserRequest;
import com.dts.dersliktakip.dto.UpdateAcademicianUserRequest;
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
import org.springframework.security.access.AccessDeniedException;
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

    private static final Set<String> VALID_ACADEMIC_TITLES = Set.of(
            "Profes\u00f6r Dr.",
            "Do\u00e7ent Dr.",
            "Dr. \u00d6\u011fretim \u00dcyesi",
            "Ara\u015ft\u0131rma G\u00f6revlisi"
    );

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final AcademicianRepository academicianRepository;
    private final FacultyRepository facultyRepository;
    private final DepartmentRepository departmentRepository;
    private final NotificationService notificationService;
    private final AccessScopeService accessScopeService;

    @Transactional(readOnly = true)
    public List<UserResponse> listUsers() {
        return userRepository.findAll()
                .stream()
                .map(userMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<UserResponse> listManagedAcademicians(User currentUser, String search, String title) {
        Department scopedDepartment = accessScopeService.requireDepartmentScope(currentUser);
        String facultyName = scopedDepartment.getFaculty().getName();
        String departmentName = scopedDepartment.getName();

        return userRepository.findByRoleAndFacultyAndDepartmentIgnoreCase(Role.ACADEMICIAN, facultyName, departmentName)
                .stream()
                .filter(user -> matchesSearch(user, search))
                .filter(user -> matchesTitle(user, title))
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
        ensureEmailAvailable(request.email());
        validateAcademicTitleForRoles(request.roles(), request.title());
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
        notificationService.createForRole(
                Role.SUPER_ADMIN,
                "Yeni kullanıcı oluşturuldu",
                saved.getFirstName() + " " + saved.getLastName() + " sisteme eklendi.",
                "/super-admin/kullanicilar"
        );
        return userMapper.toResponse(saved);
    }

    @Transactional
    public UserResponse createManagedAcademician(User currentUser, CreateAcademicianUserRequest request) {
        Department scopedDepartment = accessScopeService.requireDepartmentScope(currentUser);
        ensureEmailAvailable(request.email());
        validateAcademicTitle(request.title());

        User user = new User();
        user.setFirstName(request.firstName());
        user.setLastName(request.lastName());
        user.setEmail(request.email());
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setRoles(Set.of(Role.ACADEMICIAN));
        user.setPhone(request.phone());
        user.setActive(true);
        user.setTitle(request.title());
        user.setFaculty(scopedDepartment.getFaculty().getName());
        user.setDepartment(scopedDepartment.getName());

        User saved = userRepository.save(user);
        syncAcademicianRecord(saved, scopedDepartment.getFaculty().getId(), scopedDepartment.getId());
        return userMapper.toResponse(saved);
    }

    @Transactional
    public UserResponse updateUser(UUID id, UpdateUserRequest request) {
        User user = userRepository.findById(id).orElseThrow(() -> new com.dts.dersliktakip.exception.UserNotFoundException(id));
        validateAcademicTitleForRoles(request.roles(), request.title());
        if (!user.getEmail().equalsIgnoreCase(request.email())) {
            ensureEmailAvailableForUpdate(request.email(), id);
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

    @Transactional
    public UserResponse updateManagedAcademician(UUID id, User currentUser, UpdateAcademicianUserRequest request) {
        User user = userRepository.findById(id).orElseThrow(() -> new com.dts.dersliktakip.exception.UserNotFoundException(id));
        Department scopedDepartment = accessScopeService.requireDepartmentScope(currentUser);
        assertManagedAcademician(user, scopedDepartment);
        validateAcademicTitle(request.title());

        String previousEmail = user.getEmail();
        if (!user.getEmail().equalsIgnoreCase(request.email())) {
            ensureEmailAvailableForUpdate(request.email(), id);
            user.setEmail(request.email());
        }

        user.setFirstName(request.firstName());
        user.setLastName(request.lastName());
        user.setPhone(request.phone());
        user.setTitle(request.title());
        user.setActive(request.active());
        user.setRoles(Set.of(Role.ACADEMICIAN));
        user.setFaculty(scopedDepartment.getFaculty().getName());
        user.setDepartment(scopedDepartment.getName());

        User saved = userRepository.save(user);
        syncAcademicianRecord(saved, scopedDepartment.getFaculty().getId(), scopedDepartment.getId(), previousEmail);
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

    @Transactional
    public void deactivateManagedAcademician(UUID id, User currentUser) {
        User user = userRepository.findById(id).orElseThrow(() -> new com.dts.dersliktakip.exception.UserNotFoundException(id));
        Department scopedDepartment = accessScopeService.requireDepartmentScope(currentUser);
        assertManagedAcademician(user, scopedDepartment);
        user.setActive(false);
        user.setRoles(Set.of(Role.ACADEMICIAN));
        user.setFaculty(scopedDepartment.getFaculty().getName());
        user.setDepartment(scopedDepartment.getName());
        userRepository.save(user);
    }

    @Transactional
    public void syncAcademicianRecords() {
        userRepository.findAll().stream()
                .filter(user -> user.getRoles() != null && user.getRoles().contains(Role.ACADEMICIAN))
                .forEach(user -> syncAcademicianRecord(user, null, null));
    }

    @Transactional
    public void syncAcademicianRecord(User user) {
        syncAcademicianRecord(user, null, null);
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

        syncAcademicianRecord(user, matchingFaculty.get().getId(), matchingDepartment.get().getId(), user.getEmail());
    }

    private void syncAcademicianRecord(User user, UUID facultyId, UUID departmentId, String lookupEmail) {
        Optional<Faculty> matchingFaculty = facultyRepository.findById(facultyId);
        Optional<Department> matchingDepartment = departmentRepository.findById(departmentId);

        if (matchingFaculty.isEmpty() || matchingDepartment.isEmpty()) {
            return;
        }

        Academician academician = academicianRepository.findByEmail(lookupEmail)
                .or(() -> academicianRepository.findByEmail(user.getEmail()))
                .orElseGet(Academician::new);
        academician.setFirstName(user.getFirstName());
        academician.setLastName(user.getLastName());
        academician.setEmail(user.getEmail());
        academician.setPhone(StringUtils.hasText(user.getPhone()) ? user.getPhone() : "00000000000");
        academician.setTitle(StringUtils.hasText(user.getTitle()) ? user.getTitle() : "Dr.");
        academician.setFaculty(matchingFaculty.get());
        academician.setDepartment(matchingDepartment.get());
        academicianRepository.save(academician);
    }

    private void ensureEmailAvailable(String email) {
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new IllegalArgumentException("Bu e-posta adresiyle kayitli bir kullanici zaten bulunmaktadir.");
        }
    }

    private void ensureEmailAvailableForUpdate(String email, UUID id) {
        if (userRepository.existsByEmailIgnoreCaseAndIdNot(email, id)) {
            throw new IllegalArgumentException("Bu e-posta adresiyle kayitli bir kullanici zaten bulunmaktadir.");
        }
    }

    private boolean matchesSearch(User user, String search) {
        if (!StringUtils.hasText(search)) {
            return true;
        }
        String normalizedSearch = search.trim().toLowerCase();
        String fullName = (user.getFirstName() + " " + user.getLastName()).toLowerCase();
        return fullName.contains(normalizedSearch)
                || user.getFirstName().toLowerCase().contains(normalizedSearch)
                || user.getLastName().toLowerCase().contains(normalizedSearch)
                || user.getEmail().toLowerCase().contains(normalizedSearch);
    }

    private boolean matchesTitle(User user, String title) {
        if (!StringUtils.hasText(title)) {
            return true;
        }
        return StringUtils.hasText(user.getTitle())
                && normalizeAcademicTitle(user.getTitle()).equalsIgnoreCase(normalizeAcademicTitle(title));
    }

    private void assertManagedAcademician(User user, Department scopedDepartment) {
        Set<Role> roles = user.getRoles();
        if (roles == null || !roles.contains(Role.ACADEMICIAN)) {
            throw new AccessDeniedException("Bu kullanici akademisyen degil.");
        }
        if (!StringUtils.hasText(user.getFaculty())
                || !StringUtils.hasText(user.getDepartment())
                || !user.getFaculty().equalsIgnoreCase(scopedDepartment.getFaculty().getName())
                || !user.getDepartment().equalsIgnoreCase(scopedDepartment.getName())) {
            throw new AccessDeniedException("Bu akademisyen icin yetkiniz yok.");
        }
    }

    private void validateAcademicTitleForRoles(Set<Role> roles, String title) {
        if (roles != null && roles.contains(Role.ACADEMICIAN)) {
            validateAcademicTitle(title);
        }
    }

    private void validateAcademicTitle(String title) {
        if (!StringUtils.hasText(title) || !VALID_ACADEMIC_TITLES.contains(title.trim())) {
            throw new IllegalArgumentException("Lutfen gecerli bir unvan seciniz.");
        }
    }

    private String normalizeAcademicTitle(String title) {
        if (!StringUtils.hasText(title)) {
            return "";
        }
        return switch (title.trim()) {
            case "PROFESOR", "Prof. Dr." -> "Profes\u00f6r Dr.";
            case "DOCENT", "Do\u00e7. Dr." -> "Do\u00e7ent Dr.";
            case "DR_OGRETIM_UYESI", "Dr. \u00d6\u011fr. \u00dcyesi" -> "Dr. \u00d6\u011fretim \u00dcyesi";
            case "ARASTIRMA_GOREVLISI", "Ar\u015f. G\u00f6r." -> "Ara\u015ft\u0131rma G\u00f6revlisi";
            default -> title.trim();
        };
    }
}
