package com.dts.dersliktakip.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class FloorControllerSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @WithMockUser(roles = "DEPARTMENT_ADMIN")
    void saveLayoutRejectsNonSuperAdminRole() throws Exception {
        String requestBody = """
                {
                  "backgroundLocked": false,
                  "backgroundOpacity": 0.5,
                  "viewportZoom": 1.0,
                  "objects": []
                }
                """;

        mockMvc.perform(post("/api/floors/{floorId}/layout", UUID.randomUUID())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ACADEMICIAN")
    void classroomPlacementListRejectsNonSuperAdminRole() throws Exception {
        mockMvc.perform(get("/api/floors/{floorId}/classrooms", UUID.randomUUID()))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ACADEMICIAN")
    void slotLayoutRejectsNonSuperAdminRole() throws Exception {
        mockMvc.perform(get("/api/floors/{floorId}/slot-layout", UUID.randomUUID()))
                .andExpect(status().isForbidden());
    }
}
