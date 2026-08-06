import { apiClient } from '@/services/axios';
import { BuildingListResponse, BuildingResponse, CreateBuildingRequest, UpdateBuildingRequest } from '@/types';

export const buildingService = {
  getByFacultyId: async (facultyId: string) => {
    const response = await apiClient.get<BuildingListResponse>(`/faculties/${facultyId}/buildings`);
    return response.data;
  },
  create: async (facultyId: string, payload: CreateBuildingRequest) => {
    const response = await apiClient.post<BuildingResponse>(`/faculties/${facultyId}/buildings`, payload);
    return response.data;
  },
  update: async (id: string, payload: UpdateBuildingRequest) => {
    const response = await apiClient.put<BuildingResponse>(`/buildings/${id}`, payload);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await apiClient.delete<void>(`/buildings/${id}`);
    return response.data;
  },
};
