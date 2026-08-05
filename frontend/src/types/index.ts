export type EmptyObject = Record<string, never>;

export type Role = 'SUPER_ADMIN' | 'DEPARTMENT_ADMIN' | 'ACADEMICIAN';

export type AuthUser = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  role: Role;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};
