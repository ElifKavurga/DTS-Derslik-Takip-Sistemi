import { apiClient } from '@/services/axios';
import {
  ClassroomPlacement,
  FloorDetailResponse,
  SaveFloorLayoutRequest,
  SaveSlotLayoutRequest,
  SlotLayoutResponse,
  CreateSlotClassroomRequest,
} from '@/types';

export const floorLayoutService = {
  getFloorDetail: async (floorId: string): Promise<FloorDetailResponse> => {
    const response = await apiClient.get<FloorDetailResponse>(`/floors/${floorId}`);
    return response.data;
  },

  saveLayout: async (floorId: string, payload: SaveFloorLayoutRequest): Promise<FloorDetailResponse> => {
    const response = await apiClient.post<FloorDetailResponse>(`/floors/${floorId}/layout`, payload);
    return response.data;
  },

  getClassroomsForPlacement: async (floorId: string): Promise<ClassroomPlacement[]> => {
    const response = await apiClient.get<ClassroomPlacement[]>(`/floors/${floorId}/classrooms`);
    return response.data;
  },

  getSlotLayout: async (floorId: string): Promise<SlotLayoutResponse> => {
    const response = await apiClient.get<SlotLayoutResponse>(`/floors/${floorId}/slot-layout`);
    return response.data;
  },

  saveSlotLayout: async (floorId: string, payload: SaveSlotLayoutRequest): Promise<SlotLayoutResponse> => {
    const response = await apiClient.post<SlotLayoutResponse>(`/floors/${floorId}/slot-layout`, payload);
    return response.data;
  },

  createSlotClassroom: async (floorId: string, payload: CreateSlotClassroomRequest): Promise<SlotLayoutResponse> => {
    const response = await apiClient.post<SlotLayoutResponse>(`/floors/${floorId}/slot-layout/classrooms`, payload);
    return response.data;
  },

  createSlotTeachingSpace: async (floorId: string, payload: CreateSlotClassroomRequest): Promise<SlotLayoutResponse> => {
    const response = await apiClient.post<SlotLayoutResponse>(`/floors/${floorId}/slot-layout/teaching-spaces`, payload);
    return response.data;
  },

  deleteUnassignedSlotTeachingSpace: async (floorId: string, classroomId: string): Promise<void> => {
    await apiClient.delete(`/floors/${floorId}/slot-layout/teaching-spaces/${classroomId}`);
  },
};
