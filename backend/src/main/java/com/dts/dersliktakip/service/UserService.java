package com.dts.dersliktakip.service;

import com.dts.dersliktakip.dto.CreateUserRequest;
import com.dts.dersliktakip.dto.UpdateUserRequest;
import com.dts.dersliktakip.dto.UserResponse;
import com.dts.dersliktakip.entity.User;
import com.dts.dersliktakip.repository.UserRepository;
import com.dts.dersliktakip.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

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
        user.setFaculty(request.faculty());
        user.setDepartment(request.department());
        user.setOffice(request.office());
        User saved = userRepository.save(user);
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
        user.setFaculty(request.faculty());
        user.setDepartment(request.department());
        user.setOffice(request.office());
        User saved = userRepository.save(user);
        return userMapper.toResponse(saved);
    }

    @Transactional
    public void deleteUser(UUID id) {
        User user = userRepository.findById(id).orElseThrow(() -> new com.dts.dersliktakip.exception.UserNotFoundException(id));
        userRepository.delete(user);
    }
}
