package com.dts.dersliktakip.service;

import com.dts.dersliktakip.dto.AuthResponse;
import com.dts.dersliktakip.dto.LoginRequest;
import com.dts.dersliktakip.dto.RefreshTokenRequest;
import com.dts.dersliktakip.dto.ResetPasswordRequest;
import com.dts.dersliktakip.dto.UserResponse;
import com.dts.dersliktakip.entity.PasswordResetToken;
import com.dts.dersliktakip.entity.Role;
import com.dts.dersliktakip.entity.User;
import com.dts.dersliktakip.exception.ExpiredResetTokenException;
import com.dts.dersliktakip.mapper.UserMapper;
import com.dts.dersliktakip.repository.PasswordResetTokenRepository;
import com.dts.dersliktakip.repository.UserRepository;
import com.dts.dersliktakip.security.JwtService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtService jwtService;

    @Mock
    private UserMapper userMapper;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AuthService authService;

    @Test
    void loginReturnsTokensForActiveUser() {
        // Arrange: TC-001-01, TD-VALID-001
        User user = user(Role.SUPER_ADMIN, true);
        UserResponse userResponse = userResponse(user);

        when(userRepository.findByEmail("admin@dts.local")).thenReturn(Optional.of(user));
        when(jwtService.generateAccessToken(user.getEmail(), user.getRoles())).thenReturn("access-token");
        when(jwtService.generateRefreshToken(user.getEmail())).thenReturn("refresh-token");
        when(userMapper.toResponse(user)).thenReturn(userResponse);

        // Act
        AuthResponse response = authService.login(new LoginRequest("admin@dts.local", "<DUMMY_VALID_PASSWORD>"));

        // Assert
        assertThat(response.accessToken()).isEqualTo("access-token");
        assertThat(response.refreshToken()).isEqualTo("refresh-token");
        assertThat(response.user()).isSameAs(userResponse);
        verify(authenticationManager, times(1)).authenticate(any());
        verify(jwtService, times(1)).generateAccessToken(user.getEmail(), user.getRoles());
        verify(jwtService, times(1)).generateRefreshToken(user.getEmail());
        verify(userMapper, times(1)).toResponse(user);
    }

    @Test
    void loginRejectsInactiveUserAfterAuthentication() {
        // Arrange: TC-001-02, TD-INVALID-001
        User user = user(Role.ACADEMICIAN, false);
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));

        // Act / Assert
        assertThatThrownBy(() -> authService.login(new LoginRequest(user.getEmail(), "<DUMMY_VALID_PASSWORD>")))
                .isInstanceOf(DisabledException.class)
                .hasMessage("Account is inactive");
        verify(jwtService, never()).generateAccessToken(any(), any());
        verify(jwtService, never()).generateRefreshToken(any());
    }

    @Test
    void refreshRejectsNonRefreshToken() {
        // Arrange: AUTH-01, TD-INVALID-014
        when(jwtService.isTokenValid("not-refresh")).thenReturn(true);
        when(jwtService.isRefreshToken("not-refresh")).thenReturn(false);

        // Act / Assert
        assertThatThrownBy(() -> authService.refresh(new RefreshTokenRequest("not-refresh")))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessage("Invalid refresh token");
        verify(userRepository, never()).findByEmail(any());
    }

    @Test
    void resetPasswordRejectsExpiredToken() {
        // Arrange: TD-SPECIAL-005 negative token state
        PasswordResetToken token = resetToken(user(Role.ACADEMICIAN, true));
        token.setExpiresAt(Instant.now().minusSeconds(1));

        when(passwordResetTokenRepository.findByToken("expired-token")).thenReturn(Optional.of(token));

        // Act / Assert
        assertThatThrownBy(() -> authService.resetPassword(new ResetPasswordRequest("expired-token", "Abc12345")))
                .isInstanceOf(ExpiredResetTokenException.class)
                .hasMessage("Expired reset token");
        verify(userRepository, never()).save(any());
        verify(passwordResetTokenRepository, never()).save(any());
    }

    @Test
    void resetPasswordEncodesPasswordAndMarksTokenUsed() {
        // Arrange: REQ-3.1.4, TD-BOUNDARY-002
        User user = user(Role.ACADEMICIAN, true);
        PasswordResetToken token = resetToken(user);
        token.setExpiresAt(Instant.now().plusSeconds(300));

        when(passwordResetTokenRepository.findByToken("valid-token")).thenReturn(Optional.of(token));
        when(passwordEncoder.encode("Abc12345")).thenReturn("encoded-password");

        // Act
        authService.resetPassword(new ResetPasswordRequest("valid-token", "Abc12345"));

        // Assert
        assertThat(user.getPassword()).isEqualTo("encoded-password");
        assertThat(token.isUsed()).isTrue();

        InOrder order = inOrder(userRepository, passwordResetTokenRepository);
        order.verify(userRepository, times(1)).save(user);
        order.verify(passwordResetTokenRepository, times(1)).save(token);
    }

    private static User user(Role role, boolean active) {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setFirstName("Test");
        user.setLastName("User");
        user.setEmail(role.name().toLowerCase() + "@dts.local");
        user.setPassword("encoded");
        user.setRoles(Set.of(role));
        user.setActive(active);
        return user;
    }

    private static UserResponse userResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getFirstName() + " " + user.getLastName(),
                user.getEmail(),
                user.getRoles(),
                user.getRoles().iterator().next(),
                null,
                user.isActive(),
                null,
                user.getFaculty(),
                user.getDepartment(),
                null
        );
    }

    private static PasswordResetToken resetToken(User user) {
        PasswordResetToken token = new PasswordResetToken();
        token.setUser(user);
        token.setToken("valid-token");
        return token;
    }
}
