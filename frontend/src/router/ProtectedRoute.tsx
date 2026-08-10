import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { getDashboardPathByRole } from '@/router/roleRoutes';
import { useAuthStore } from '@/store/useAuthStore';
import type { Role } from '@/types';

type ProtectedRouteProps = {
  allowedRoles?: Role[];
};

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const role = useAuthStore((state) => state.user?.role);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/giris" replace state={{ from: location }} />;
  }

  if (allowedRoles && (!role || !allowedRoles.includes(role))) {
    return <Navigate to={getDashboardPathByRole(role)} replace />;
  }

  return <Outlet />;
};
