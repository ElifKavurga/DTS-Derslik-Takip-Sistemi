import type { PlanMode } from './floorLayout';

export interface FloorResponse {
  id: string;
  name: string;
  level: number;
  planMode: PlanMode;
  buildingId: string;
  createdAt: string;
  updatedAt: string;
  totalClassrooms: number;
}

export interface FloorListResponse {
  floors: FloorResponse[];
}

export interface CreateFloorRequest {
  name: string;
  level: number;
  planMode?: PlanMode;
}

export interface UpdateFloorRequest {
  name: string;
  level: number;
  planMode?: PlanMode;
}
