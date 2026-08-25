package com.dts.dersliktakip.integration;

import com.dts.dersliktakip.entity.Role;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AuthenticationIT extends IntegrationTestSupport {

    @Test
    void loginWithValidUserReturnsJwtAndMeUsesAuthenticatedPrincipal() throws Exception {
        // REQ-3.1.1 -> TS-001 -> TC-001-01 -> TD-VALID-001
        user("super-auth-it@dts.test", Role.SUPER_ADMIN, null, null);

        String token = loginToken("super-auth-it@dts.test");

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("super-auth-it@dts.test"))
                .andExpect(jsonPath("$.roles[0]").value("SUPER_ADMIN"));
    }

    @Test
    void loginWithInvalidPasswordIsRejected() throws Exception {
        // REQ-3.1.1 -> TS-001 -> TC-001-02 -> TD-INVALID-001
        user("invalid-login-it@dts.test", Role.DEPARTMENT_ADMIN, "MF", "CENG");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", "invalid-login-it@dts.test",
                                "password", "wrong-password"
                        ))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    void protectedEndpointWithoutAuthenticationReturnsUnauthorized() throws Exception {
        // AUTH-01 -> TS-023 -> TC-023-01 -> TD-INVALID-014
        mockMvc.perform(get("/api/schedules"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }
}
