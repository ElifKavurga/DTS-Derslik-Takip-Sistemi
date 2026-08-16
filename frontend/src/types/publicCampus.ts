import { SpaceObjectStatus, SpaceObjectType } from '@/types/floorLayout';

export interface PublicFacultyResponse {
  id: string;
  name: string;
  code: string;
}

export interface PublicFacultyListResponse {
  faculties: PublicFacultyResponse[];
}

export interface PublicBuildingResponse {
  id: string;
  name: string;
  code: string;
  facultyId: string;
}

export interface PublicBuildingListResponse {
  buildings: PublicBuildingResponse[];
}

export interface PublicFloorResponse {
  id: string;
  name: string;
  level: number;
  buildingId: string;
}

export interface PublicFloorListResponse {
  floors: PublicFloorResponse[];
}

export interface PublicSpaceObjectResponse {
  id: string;
  classroomId?: string;
  type: SpaceObjectType;
  status: SpaceObjectStatus;
  label?: string;
  code?: string;
  capacity?: number;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  rotation: number;
  slotRow?: number;
  slotColumn?: number;
  placed?: boolean;
}

export interface PublicFloorDetailResponse {
  id: string;
  name: string;
  level: number;
  buildingId: string;
  buildingName: string;
  facultyId: string;
  facultyName: string;
  backgroundImageBase64?: string;
  backgroundImageType?: string;
  backgroundX: number;
  backgroundY: number;
  backgroundWidth?: number;
  backgroundHeight?: number;
  backgroundOpacity: number;
  objects: PublicSpaceObjectResponse[];
}
