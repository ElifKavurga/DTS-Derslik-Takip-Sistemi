import { Role } from '@/types';

export const ROLE_DASHBOARD_PATHS: Record<Role, string> = {
  SUPER_ADMIN: '/super-admin/dashboard',
  DEPARTMENT_ADMIN: '/department-admin/dashboard',
  ACADEMICIAN: '/academician/dashboard',
};

export const getDashboardPathByRole = (role?: Role) => {
  return role ? ROLE_DASHBOARD_PATHS[role] : '/dashboard';
};
