import { Navigate, Outlet } from 'react-router-dom';
import { getDashboardPathByRole } from '@/router/roleRoutes';
import { useAuthStore } from '@/store/useAuthStore';

export const PublicRoute = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const role = useAuthStore((state) => state.user?.role);

  if (isAuthenticated) {
    return <Navigate to={getDashboardPathByRole(role)} replace />;
  }

  return <Outlet />;
};
