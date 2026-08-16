import { apiClient } from '@/services/axios';
import {
  PublicBuildingListResponse,
  PublicBuildingResponse,
  PublicFacultyListResponse,
  PublicFloorDetailResponse,
  PublicFloorListResponse,
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
};
