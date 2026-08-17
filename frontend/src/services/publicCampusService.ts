import { apiClient } from '@/services/axios';
import {
  PublicBuildingListResponse,
  PublicBuildingResponse,
  PublicClassroomDailyScheduleResponse,
  PublicFacultyListResponse,
  PublicFloorDetailResponse,
  PublicFloorListResponse,
  PublicWeeklyScheduleResponse,
  PublicDepartmentListResponse,
  PublicClassLevelListResponse,
} from '@/types';

export const publicCampusService = {
  getFaculties: async () => {
    const response = await apiClient.get<PublicFacultyListResponse>('/public/faculties');
    return response.data;
  },
  getBuildingsByFacultyId: async (facultyId: string) => {
    const response = await apiClient.get<PublicBuildingListResponse>(`/public/faculties/${facultyId}/buildings`);
    return response.data;
  },
  getBuildingByFacultyId: async (facultyId: string, buildingId: string) => {
    const response = await apiClient.get<PublicBuildingResponse>(`/public/faculties/${facultyId}/buildings/${buildingId}`);
    return response.data;
  },
  getFloorsByBuildingId: async (buildingId: string) => {
    const response = await apiClient.get<PublicFloorListResponse>(`/public/buildings/${buildingId}/floors`);
    return response.data;
  },
  getFloorView: async (buildingId: string, floorId: string) => {
    const response = await apiClient.get<PublicFloorDetailResponse>(`/public/buildings/${buildingId}/floors/${floorId}`);
    return response.data;
  },
  getClassroomDailySchedule: async (classroomId: string, date: string) => {
    const response = await apiClient.get<PublicClassroomDailyScheduleResponse>(`/public/classrooms/${classroomId}/schedule`, {
      params: { date },
    });
    return response.data;
  },
  getClassroomWeeklySchedule: async (classroomId: string, startDate: string, endDate: string) => {
    const response = await apiClient.get<PublicWeeklyScheduleResponse>(`/public/classrooms/${classroomId}/weekly-schedule`, {
      params: { startDate, endDate },
    });
    return response.data;
  },
  getDepartments: async () => {
    const response = await apiClient.get<PublicDepartmentListResponse>('/public/departments');
    return response.data;
  },
  getDepartmentClassLevels: async (departmentId: string) => {
    const response = await apiClient.get<PublicClassLevelListResponse>(`/public/departments/${departmentId}/class-levels`);
    return response.data;
  },
  getDepartmentWeeklySchedule: async (departmentId: string, classLevel: number, startDate: string, endDate: string) => {
    const response = await apiClient.get<PublicWeeklyScheduleResponse>(`/public/departments/${departmentId}/class-levels/${classLevel}/weekly-schedule`, {
      params: { startDate, endDate },
    });
    return response.data;
  },
};

