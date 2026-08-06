import { apiClient } from '@/services/axios';
import { FloorDetailResponse, SaveFloorLayoutRequest } from '@/types';

export const floorLayoutService = {
  getFloorDetail: async (floorId: string): Promise<FloorDetailResponse> => {
    const response = await apiClient.get<FloorDetailResponse>(`/floors/${floorId}`);
    return response.data;
  },

  saveLayout: async (floorId: string, payload: SaveFloorLayoutRequest): Promise<FloorDetailResponse> => {
    const response = await apiClient.post<FloorDetailResponse>(`/floors/${floorId}/layout`, payload);
    return response.data;
  },
};
