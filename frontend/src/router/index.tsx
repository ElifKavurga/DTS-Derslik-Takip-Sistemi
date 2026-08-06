import { Navigate, createBrowserRouter } from 'react-router-dom';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { NotFoundPage } from '@/pages/errors/NotFoundPage';
import { UnderDevelopmentPage } from '@/pages/errors/UnderDevelopmentPage';
import { FacultyPage } from '@/pages/campus/FacultyPage';
import { FacultyDetailPage } from '@/pages/campus/FacultyDetailPage';
import { BuildingDetailPage } from '@/pages/campus/BuildingDetailPage';
import { ProfilePage } from '@/pages/profile/ProfilePage';
import { ProtectedRoute } from '@/router/ProtectedRoute';
import { PublicRoute } from '@/router/PublicRoute';


export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/giris" replace />,
  },
  {
    element: <PublicRoute />,
    children: [
      {
        path: '/giris',
        element: <LoginPage />,
      },
      {
        path: '/sifremi-unuttum',
        element: <ForgotPasswordPage />,
      },
      {
        path: '/sifre-sifirla',
        element: <ResetPasswordPage />,
      },
      {
        path: '/login',
        element: <Navigate to="/giris" replace />,
      },
      {
        path: '/forgot-password',
        element: <Navigate to="/sifremi-unuttum" replace />,
      },
      {
        path: '/reset-password',
        element: <Navigate to="/sifre-sifirla" replace />,
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
            path: '/super-admin/fakulteler',
            element: <FacultyPage />,
          },
          {
            path: '/super-admin/fakulteler/:id',
            element: <FacultyDetailPage />,
          },
          {
            path: '/super-admin/binalar/:id',
            element: <BuildingDetailPage />,
          },
          {
            path: '/super-admin/katlar',
            element: <UnderDevelopmentPage title="Kat Yönetimi" />,
          },
          {
            path: '/super-admin/bolumler',
            element: <UnderDevelopmentPage title="Bölüm Yönetimi" />,
          },
          {
            path: '/super-admin/kullanicilar',
            element: <UnderDevelopmentPage title="Kullanıcı Yönetimi" />,
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
