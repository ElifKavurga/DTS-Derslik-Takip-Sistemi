package com.dts.dersliktakip.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class DashboardStatsResponse {
    private DashboardCardStats stats;
    private List<RecentFacultyResponse> recentFaculties;
    private List<RecentBuildingResponse> recentBuildings;
    private List<RecentUserResponse> recentUsers;
}
