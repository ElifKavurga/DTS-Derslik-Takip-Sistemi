export interface BuildingResponse {
  id: string;
  name: string;
  code: string;
  facultyId: string;
  createdAt: string;
  updatedAt: string;
  totalFloors: number;
  totalClassrooms: number;
}

export interface BuildingListResponse {
  buildings: BuildingResponse[];
}

export interface CreateBuildingRequest {
  name: string;
  code: string;
}

export interface UpdateBuildingRequest {
  name: string;
  code: string;
}
