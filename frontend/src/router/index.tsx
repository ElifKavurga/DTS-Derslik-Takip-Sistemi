import { Navigate, createBrowserRouter } from 'react-router-dom';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { NotFoundPage } from '@/pages/errors/NotFoundPage';
import { ProfilePage } from '@/pages/profile/ProfilePage';
import { ProtectedRoute } from '@/router/ProtectedRoute';
import { PublicRoute } from '@/router/PublicRoute';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    element: <PublicRoute />,
    children: [
      {
        path: '/login',
        element: <LoginPage />,
      },
      {
        path: '/forgot-password',
        element: <ForgotPasswordPage />,
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          {
            path: '/dashboard',
            element: <DashboardPage />,
          },
          {
            path: '/super-admin/dashboard',
            element: <DashboardPage />,
          },
          {
            path: '/department-admin/dashboard',
            element: <DashboardPage />,
          },
          {
            path: '/academician/dashboard',
            element: <DashboardPage />,
          },
          {
            path: '/profile',
            element: <ProfilePage />,
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
