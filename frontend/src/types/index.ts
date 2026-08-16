export type EmptyObject = Record<string, never>;

export type Role = 'SUPER_ADMIN' | 'DEPARTMENT_ADMIN' | 'ACADEMICIAN';

export type AuthUser = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  role: Role;
  roles?: Role[];
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type ForgotPasswordRequest = {
  email: string;
};

export type ResetPasswordRequest = {
  token: string;
  newPassword: string;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

export type UserResponse = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  roles?: Role[];
  role: Role;
  phone?: string | null;
  active: boolean;
  title?: string | null;
  faculty?: string | null;
  department?: string | null;
  office?: string | null;
};

export type ResetPasswordResponse = {
  message: string;
};

export type ProfileResponse = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  role: Role;
  roles?: Role[];
  phone?: string | null;
  title?: string | null;
  department?: string | null;
  faculty?: string | null;
  avatarUrl?: string | null;
};

export type UpdateProfileRequest = {
  firstName: string;
  lastName: string;
  phone?: string | null;
  title?: string | null;
  avatarUrl?: string | null;
};

export type UpdateProfileResponse = ProfileResponse;

export type ChangePasswordRequest = {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
};

export type ChangePasswordResponse = {
  message: string;
};

export * from './dashboard';
export * from './faculty';
export * from './building';
export * from './floor';
export * from './floorLayout';
export * from './course';
export * from './schedule';
export * from './scheduleException';
export * from './publicCampus';
