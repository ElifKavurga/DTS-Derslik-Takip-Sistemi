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
