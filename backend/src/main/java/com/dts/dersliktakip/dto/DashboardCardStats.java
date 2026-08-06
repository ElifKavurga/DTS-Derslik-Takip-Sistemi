package com.dts.dersliktakip.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DashboardCardStats {
    private long totalFaculties;
    private long totalBuildings;
    private long totalFloors;
    private long totalDepartments;
    private long totalClassrooms;
    private long totalAcademicians;
    private long totalDepartmentAdmins;
    private long totalUsers;
}
