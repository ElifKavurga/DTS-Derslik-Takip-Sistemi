package com.dts.dersliktakip.controller;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.TestExecutionEvent;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import com.dts.dersliktakip.service.ProfileService;
import com.dts.dersliktakip.security.ApplicationUserDetailsService;
import com.dts.dersliktakip.security.UserPrincipal;
import com.dts.dersliktakip.entity.User;
import com.dts.dersliktakip.entity.Role;
import java.util.Set;
import java.util.UUID;
import static org.mockito.Mockito.when;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ProfileControllerSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ProfileService profileService;

    @MockBean
    private ApplicationUserDetailsService userDetailsService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(UUID.randomUUID());
        testUser.setEmail("ahmet.yilmaz@inonu.edu.tr");
        testUser.setFirstName("Ahmet");
        testUser.setLastName("Yılmaz");
        testUser.setRoles(Set.of(Role.ACADEMICIAN));
        
        UserPrincipal principal = new UserPrincipal(testUser);
        when(userDetailsService.loadUserByUsername("ahmet.yilmaz@inonu.edu.tr"))
                .thenReturn(principal);
    }

    @Test
    @WithUserDetails(value = "ahmet.yilmaz@inonu.edu.tr", userDetailsServiceBeanName = "applicationUserDetailsService", setupBefore = TestExecutionEvent.TEST_EXECUTION)
    void getProfileAllowsAcademician() throws Exception {
        mockMvc.perform(get("/api/profile"))
                .andExpect(status().isOk());
    }

    @Test
    @WithUserDetails(value = "ahmet.yilmaz@inonu.edu.tr", userDetailsServiceBeanName = "applicationUserDetailsService", setupBefore = TestExecutionEvent.TEST_EXECUTION)
    void updateProfileAllowsAcademician() throws Exception {
        String requestBody = """
                {
                  "firstName": "Ahmet",
                  "lastName": "Yılmaz",
                  "phone": "+90 555 111 22 33",
                  "title": "Doç. Dr.",
                  "avatarUrl": "http://example.com/avatar.jpg"
                }
                """;

        mockMvc.perform(put("/api/profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk());
    }

    @Test
    void getProfileRejectsUnauthenticated() throws Exception {
        mockMvc.perform(get("/api/profile"))
                .andExpect(status().isUnauthorized());
    }
}
