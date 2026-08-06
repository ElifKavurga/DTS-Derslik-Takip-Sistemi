package com.dts.dersliktakip.service;

import com.dts.dersliktakip.dto.AuthResponse;
import com.dts.dersliktakip.dto.LoginRequest;
import com.dts.dersliktakip.dto.RefreshTokenRequest;
import com.dts.dersliktakip.dto.UserResponse;
import com.dts.dersliktakip.entity.User;
import com.dts.dersliktakip.exception.ResourceNotFoundException;
import com.dts.dersliktakip.mapper.UserMapper;
import com.dts.dersliktakip.repository.UserRepository;
import com.dts.dersliktakip.security.JwtService;
import com.dts.dersliktakip.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserMapper userMapper;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );

        User user = getActiveUserByEmail(request.email());
        return buildAuthResponse(user);
    }

    @Transactional(readOnly = true)
    public AuthResponse refresh(RefreshTokenRequest request) {
        String refreshToken = request.refreshToken();

        if (!jwtService.isTokenValid(refreshToken) || !jwtService.isRefreshToken(refreshToken)) {
            throw new BadCredentialsException("Invalid refresh token");
        }

        User user = getActiveUserByEmail(jwtService.extractSubject(refreshToken));
        return buildAuthResponse(user);
    }

    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(UserPrincipal principal) {
        return userMapper.toResponse(principal.getUser());
    }

    private AuthResponse buildAuthResponse(User user) {
        String accessToken = jwtService.generateAccessToken(user.getEmail(), user.getRole());
        String refreshToken = jwtService.generateRefreshToken(user.getEmail());

        return new AuthResponse(accessToken, refreshToken, userMapper.toResponse(user));
    }

    private User getActiveUserByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!user.isActive()) {
            throw new DisabledException("Account is inactive");
        }

        return user;
    }
}
