import { Role } from './index';

export interface DashboardCardStats {
  totalFaculties: number;
  totalBuildings: number;
  totalFloors: number;
  totalDepartments: number;
  totalClassrooms: number;
  totalAcademicians: number;
  totalDepartmentAdmins: number;
  totalUsers: number;
}

export interface RecentFaculty {
  id: string;
  name: string;
  code: string;
  createdAt: string;
}

export interface RecentBuilding {
  id: string;
  name: string;
  code: string;
  facultyName: string;
  createdAt: string;
}

export interface RecentUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface DashboardStatsResponse {
  stats: DashboardCardStats;
  recentFaculties: RecentFaculty[];
  recentBuildings: RecentBuilding[];
  recentUsers: RecentUser[];
}
