package com.dts.dersliktakip.service;

import com.dts.dersliktakip.dto.ChangePasswordRequest;
import com.dts.dersliktakip.dto.ChangePasswordResponse;
import com.dts.dersliktakip.dto.ProfileResponse;
import com.dts.dersliktakip.dto.UpdateProfileRequest;
import com.dts.dersliktakip.dto.UpdateProfileResponse;
import com.dts.dersliktakip.entity.User;
import com.dts.dersliktakip.exception.ResourceNotFoundException;
import com.dts.dersliktakip.mapper.ProfileMapper;
import com.dts.dersliktakip.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final UserRepository userRepository;
    private final ProfileMapper profileMapper;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public ProfileResponse getProfile(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Kullanıcı bulunamadı"));
        return profileMapper.toResponse(user);
    }

    @Transactional
    public UpdateProfileResponse updateProfile(UUID userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Kullanıcı bulunamadı"));

        profileMapper.updateEntityFromRequest(request, user);
        User updatedUser = userRepository.save(user);

        return profileMapper.toUpdateResponse(updatedUser);
    }

    @Transactional
    public ChangePasswordResponse changePassword(UUID userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Kullanıcı bulunamadı"));

        // 1. Current password must match
        if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Mevcut şifre hatalı.");
        }

        // 2. New password cannot be the same as current password
        if (passwordEncoder.matches(request.newPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Yeni şifre mevcut şifre ile aynı olamaz.");
        }

        // 3. New password and confirm password must match
        if (!request.newPassword().equals(request.confirmPassword())) {
            throw new IllegalArgumentException("Yeni şifreler eşleşmiyor.");
        }

        // 4. Encrypt and save new password
        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);

        return new ChangePasswordResponse("Şifreniz başarıyla değiştirildi.");
    }
}
