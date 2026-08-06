package com.dts.dersliktakip.service;

import com.dts.dersliktakip.dto.ProfileResponse;
import com.dts.dersliktakip.dto.UpdateProfileRequest;
import com.dts.dersliktakip.dto.UpdateProfileResponse;
import com.dts.dersliktakip.entity.User;
import com.dts.dersliktakip.exception.ResourceNotFoundException;
import com.dts.dersliktakip.mapper.ProfileMapper;
import com.dts.dersliktakip.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final UserRepository userRepository;
    private final ProfileMapper profileMapper;

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
}
