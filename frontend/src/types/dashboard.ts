import { Role } from './index';
import { Semester } from './course';
import { ScheduleCompletionResponse } from './schedule';

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

export interface DepartmentAdminDashboardResponse {
  departmentId: string;
  departmentName: string;
  departmentCode: string;
  facultyId: string;
  facultyName: string;
  academicianCount: number;
  courseCount: number;
  semester?: Semester | null;
  classroomCount: number;
  scheduleSummary: ScheduleCompletionResponse;
  warnings: string[];
}

import { AcademicianResponse, CourseResponse } from './course';
import { WeeklyScheduleResponse } from './schedule';

export interface AcademicianDashboardResponse {
  academician: AcademicianResponse;
  academicTerm: string;
  todayCourses: WeeklyScheduleResponse[];
  nextCourse?: WeeklyScheduleResponse | null;
  courses: CourseResponse[];
  weeklySummary: Record<string, number>;
}
