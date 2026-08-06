export interface FacultyResponse {
  id: string;
  name: string;
  code: string;
  createdAt: string;
  updatedAt: string;
  totalBuildings: number;
  totalFloors: number;
  totalClassrooms: number;
}

export interface FacultyListResponse {
  faculties: FacultyResponse[];
}

export interface CreateFacultyRequest {
  name: string;
  code: string;
}

export interface UpdateFacultyRequest {
  name: string;
  code: string;
}
