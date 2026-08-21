import type { ReactNode } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuthStore } from '@/store/useAuthStore';

type PublicPageRouteProps = {
  children: ReactNode;
};

export const PublicPageRoute = ({ children }: PublicPageRouteProps) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return isAuthenticated ? <AppLayout>{children}</AppLayout> : <>{children}</>;
};
