export type TermType = 'FALL' | 'SPRING';

export interface AcademicPeriod {
  id: string;
  academicYear: string;
  termType: TermType;
  displayName: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface CreateAcademicPeriodRequest {
  academicYear: string;
  termType: TermType;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface UpdateAcademicPeriodRequest {
  academicYear: string;
  termType: TermType;
  startDate: string;
  endDate: string;
  isActive: boolean;
}
