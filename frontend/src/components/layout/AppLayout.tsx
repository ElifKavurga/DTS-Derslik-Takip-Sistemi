import { useMemo, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { Sidebar } from '@/components/layout/Sidebar';
import { useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/utils/cn';

const pageMeta: Record<string, { title: string; breadcrumbs: string[] }> = {
  dashboard: {
    title: 'Ana Ekran',
    breadcrumbs: ['Ana Ekran'],
  },
  profile: {
    title: 'Profil',
    breadcrumbs: ['Hesap', 'Profil'],
  },
};

const resolvePageMeta = (pathname: string) => {
  if (pathname.includes('/profile')) {
    return pageMeta.profile;
  }

  return pageMeta.dashboard;
};

export const AppLayout = () => {
  const location = useLocation();
  const role = useAuthStore((state) => state.user?.role);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const meta = useMemo(() => resolvePageMeta(location.pathname), [location.pathname]);

  return (
    <div className="min-h-screen bg-[#f6f8fa] text-slate-950">
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        role={role}
        onCloseMobile={() => setMobileOpen(false)}
        onToggleCollapsed={() => setCollapsed((value) => !value)}
      />

      <div className={cn('min-h-screen transition-all duration-300', collapsed ? 'lg:pl-[72px]' : 'lg:pl-[260px]')}>
        <Header title={meta.title} breadcrumbs={meta.breadcrumbs} onOpenSidebar={() => setMobileOpen(true)} />
        <main>
          <PageContainer>
            <Outlet />
          </PageContainer>
        </main>
      </div>
    </div>
  );
};
