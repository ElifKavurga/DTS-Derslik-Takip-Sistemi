package com.dts.dersliktakip.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AcademicianControllerSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @WithMockUser(roles = "SUPER_ADMIN")
    void managedAcademiciansRejectsSuperAdminRole() throws Exception {
        mockMvc.perform(get("/api/academicians/manage"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ACADEMICIAN")
    void managedAcademiciansRejectsAcademicianRole() throws Exception {
        mockMvc.perform(get("/api/academicians/manage"))
                .andExpect(status().isForbidden());
    }

    @Test
    void managedAcademiciansRejectsAnonymousUser() throws Exception {
        mockMvc.perform(get("/api/academicians/manage"))
                .andExpect(status().isUnauthorized());
    }
}
