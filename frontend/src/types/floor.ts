export interface FloorResponse {
  id: string;
  name: string;
  level: number;
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
}

export interface UpdateFloorRequest {
  name: string;
  level: number;
}
