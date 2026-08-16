import { apiClient } from '@/services/axios';
import { PublicBuildingListResponse, PublicBuildingResponse, PublicFacultyListResponse } from '@/types';

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
};
