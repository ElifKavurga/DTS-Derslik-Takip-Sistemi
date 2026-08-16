import { Navigate, createBrowserRouter } from 'react-router-dom';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { NotFoundPage } from '@/pages/errors/NotFoundPage';
import { FacultyPage } from '@/pages/campus/FacultyPage';
import { FacultyDetailPage } from '@/pages/campus/FacultyDetailPage';
import { BuildingDetailPage } from '@/pages/campus/BuildingDetailPage';
import { FloorEditorPage } from '@/pages/campus/FloorEditorPage';
import { ProfilePage } from '@/pages/profile/ProfilePage';
import { UsersPage } from '@/pages/admin/UsersPage';
import { CoursesPage } from '@/pages/admin/CoursesPage';
import { DepartmentsPage } from '@/pages/admin/DepartmentsPage';
import { DepartmentDetailPage } from '@/pages/admin/DepartmentDetailPage';
import { AcademiciansPage } from '@/pages/departmentAdmin/AcademiciansPage';
import { SchedulePage } from '@/pages/departmentAdmin/SchedulePage';
import { AcademicianCoursesPage } from '@/pages/academician/AcademicianCoursesPage';
import { AcademicianExceptionsPage } from '@/pages/academician/AcademicianExceptionsPage';
import { ClassroomExplorerPage } from '@/pages/public/ClassroomExplorerPage';
import { ProtectedRoute } from '@/router/ProtectedRoute';
import { PublicRoute } from '@/router/PublicRoute';


export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/giris" replace />,
  },
  {
    path: '/classrooms',
    element: <ClassroomExplorerPage />,
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
            element: <ProtectedRoute allowedRoles={['SUPER_ADMIN']} />,
            children: [
              {
                path: '/super-admin/dashboard',
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
                path: '/super-admin/bolumler',
                element: <DepartmentsPage />,
              },
              {
                path: '/super-admin/bolumler/:id',
                element: <DepartmentDetailPage />,
              },
              {
                path: '/super-admin/kullanicilar',
                element: <UsersPage />,
              },
              {
                path: '/super-admin/dersler',
                element: <CoursesPage />,
              },
            ],
          },
          {
            element: <ProtectedRoute allowedRoles={['DEPARTMENT_ADMIN']} />,
            children: [
              {
                path: '/department-admin/dashboard',
                element: <DashboardPage />,
              },
              {
                path: '/department-admin/academisyenler',
                element: <AcademiciansPage />,
              },
              {
                path: '/department-admin/dersler',
                element: <CoursesPage />,
              },
              {
                path: '/department-admin/ders-programi',
                element: <SchedulePage />,
              },
            ],
          },
          {
            element: <ProtectedRoute allowedRoles={['ACADEMICIAN']} />,
            children: [
              {
                path: '/academician/dashboard',
                element: <DashboardPage />,
              },
              {
                path: '/academician/ders-programi',
                element: <SchedulePage />,
              },
              {
                path: '/academician/dersler',
                element: <AcademicianCoursesPage />,
              },
              {
                path: '/academician/istisnalar',
                element: <AcademicianExceptionsPage />,
              },
            ],
          },
          {
            path: '/profile',
            element: <ProfilePage />,
          },
        ],
      },
      // Full-screen editor routes (no DashboardLayout sidebar/header)
      {
        element: <ProtectedRoute allowedRoles={['SUPER_ADMIN']} />,
        children: [
          {
            path: '/super-admin/katlar/:id',
            element: <FloorEditorPage />,
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
