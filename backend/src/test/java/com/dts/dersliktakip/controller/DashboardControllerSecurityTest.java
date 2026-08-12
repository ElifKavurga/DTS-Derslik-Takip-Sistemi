package com.dts.dersliktakip.controller;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.TestExecutionEvent;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import com.dts.dersliktakip.service.DashboardService;
import com.dts.dersliktakip.security.ApplicationUserDetailsService;
import com.dts.dersliktakip.security.UserPrincipal;
import com.dts.dersliktakip.entity.User;
import com.dts.dersliktakip.entity.Role;
import java.util.Set;
import static org.mockito.Mockito.when;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class DashboardControllerSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private DashboardService dashboardService;

    @MockBean
    private ApplicationUserDetailsService userDetailsService;

    @BeforeEach
    void setUp() {
        User user = new User();
        user.setEmail("ahmet.yilmaz@inonu.edu.tr");
        user.setFirstName("Ahmet");
        user.setLastName("Yılmaz");
        user.setRoles(Set.of(Role.ACADEMICIAN));
        UserPrincipal principal = new UserPrincipal(user);
        when(userDetailsService.loadUserByUsername("ahmet.yilmaz@inonu.edu.tr"))
                .thenReturn(principal);
    }

    @Test
    @WithMockUser(roles = "SUPER_ADMIN")
    void departmentAdminDashboardRejectsSuperAdminRole() throws Exception {
        mockMvc.perform(get("/api/dashboard/department-admin"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ACADEMICIAN")
    void departmentAdminDashboardRejectsAcademicianRole() throws Exception {
        mockMvc.perform(get("/api/dashboard/department-admin"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithUserDetails(value = "ahmet.yilmaz@inonu.edu.tr", userDetailsServiceBeanName = "applicationUserDetailsService", setupBefore = TestExecutionEvent.TEST_EXECUTION)
    void academicianDashboardAllowsAcademicianRole() throws Exception {
        mockMvc.perform(get("/api/dashboard/academician"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "SUPER_ADMIN")
    void academicianDashboardRejectsSuperAdminRole() throws Exception {
        mockMvc.perform(get("/api/dashboard/academician"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "DEPARTMENT_ADMIN")
    void academicianDashboardRejectsDepartmentAdminRole() throws Exception {
        mockMvc.perform(get("/api/dashboard/academician"))
                .andExpect(status().isForbidden());
    }
}
