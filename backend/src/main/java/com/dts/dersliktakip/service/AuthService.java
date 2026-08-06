package com.dts.dersliktakip.service;

import com.dts.dersliktakip.dto.AuthResponse;
import com.dts.dersliktakip.dto.ForgotPasswordRequest;
import com.dts.dersliktakip.dto.LoginRequest;
import com.dts.dersliktakip.dto.RefreshTokenRequest;
import com.dts.dersliktakip.dto.ResetPasswordRequest;
import com.dts.dersliktakip.dto.ResetPasswordResponse;
import com.dts.dersliktakip.dto.UserResponse;
import com.dts.dersliktakip.entity.PasswordResetToken;
import com.dts.dersliktakip.entity.User;
import com.dts.dersliktakip.exception.ExpiredResetTokenException;
import com.dts.dersliktakip.exception.InvalidResetTokenException;
import com.dts.dersliktakip.exception.ResourceNotFoundException;
import com.dts.dersliktakip.exception.UserNotFoundException;
import com.dts.dersliktakip.mapper.UserMapper;
import com.dts.dersliktakip.repository.PasswordResetTokenRepository;
import com.dts.dersliktakip.repository.UserRepository;
import com.dts.dersliktakip.security.JwtService;
import com.dts.dersliktakip.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final int RESET_TOKEN_BYTE_LENGTH = 32;
    private static final Duration RESET_TOKEN_DURATION = Duration.ofMinutes(30);
    private static final String FORGOT_PASSWORD_RESPONSE_MESSAGE =
            "Eger bu e-posta adresi sistemde kayitliysa sifre sifirlama baglantisi olusturuldu.";
    private static final String RESET_PASSWORD_RESPONSE_MESSAGE = "Sifreniz basariyla guncellendi.";

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserMapper userMapper;
    private final UserRepository userRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final SecureRandom secureRandom = new SecureRandom();

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

    @Transactional
    public ResetPasswordResponse forgotPassword(ForgotPasswordRequest request) {
        userRepository.findByEmail(request.email())
                .filter(User::isActive)
                .ifPresent(this::createPasswordResetToken);

        return new ResetPasswordResponse(FORGOT_PASSWORD_RESPONSE_MESSAGE);
    }

    @Transactional(readOnly = true)
    public void validateResetToken(String token) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(token)
                .orElseThrow(() -> new InvalidResetTokenException("Invalid reset token"));

        validateUsableResetToken(resetToken);
    }

    @Transactional
    public ResetPasswordResponse resetPassword(ResetPasswordRequest request) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(request.token())
                .orElseThrow(() -> new InvalidResetTokenException("Invalid reset token"));

        validateUsableResetToken(resetToken);

        User user = resetToken.getUser();
        if (!user.isActive()) {
            throw new UserNotFoundException("User not found");
        }

        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);

        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);

        return new ResetPasswordResponse(RESET_PASSWORD_RESPONSE_MESSAGE);
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

    private void createPasswordResetToken(User user) {
        passwordResetTokenRepository.markUnusedTokensAsUsed(user);

        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setUser(user);
        resetToken.setToken(generateSecureToken());
        resetToken.setExpiresAt(Instant.now().plus(RESET_TOKEN_DURATION));

        passwordResetTokenRepository.save(resetToken);
    }

    private String generateSecureToken() {
        byte[] tokenBytes = new byte[RESET_TOKEN_BYTE_LENGTH];
        secureRandom.nextBytes(tokenBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(tokenBytes);
    }

    private void validateUsableResetToken(PasswordResetToken resetToken) {
        if (resetToken.isUsed()) {
            throw new InvalidResetTokenException("Invalid reset token");
        }

        if (resetToken.getExpiresAt().isBefore(Instant.now())) {
            throw new ExpiredResetTokenException("Expired reset token");
        }
    }
}
