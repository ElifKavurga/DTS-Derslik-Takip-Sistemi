import { apiClient } from '@/services/axios';
import { FloorListResponse, FloorResponse, CreateFloorRequest, UpdateFloorRequest } from '@/types';

export const floorService = {
  getByBuildingId: async (buildingId: string) => {
    const response = await apiClient.get<FloorListResponse>(`/buildings/${buildingId}/floors`);
    return response.data;
  },
  create: async (buildingId: string, payload: CreateFloorRequest) => {
    const response = await apiClient.post<FloorResponse>(`/buildings/${buildingId}/floors`, payload);
    return response.data;
  },
  update: async (id: string, payload: UpdateFloorRequest) => {
    const response = await apiClient.put<FloorResponse>(`/floors/${id}`, payload);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await apiClient.delete<void>(`/floors/${id}`);
    return response.data;
  },
};
