import { apiClient } from '@/services/axios';
import { ProfileResponse, UpdateProfileRequest, UpdateProfileResponse } from '@/types';

export const profileService = {
  getProfile: async () => {
    const response = await apiClient.get<ProfileResponse>('/profile');
    return response.data;
  },
  updateProfile: async (payload: UpdateProfileRequest) => {
    const response = await apiClient.put<UpdateProfileResponse>('/profile', payload);
    return response.data;
  },
};
