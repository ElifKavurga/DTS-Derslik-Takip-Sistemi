import { useMemo, useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { Sidebar } from '@/components/layout/Sidebar';
import { useAuthStore } from '@/store/useAuthStore';
import { useHeaderStore } from '@/store/useHeaderStore';
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
  faculties: {
    title: 'Fakülte Yönetimi',
    breadcrumbs: ['Ana Ekran', 'Kampüs Yönetimi', 'Fakülteler'],
  },
  departments: {
    title: 'Bölüm Yönetimi',
    breadcrumbs: ['Ana Ekran', 'Bölüm Yönetimi'],
  },
  academicians: {
    title: 'Akademisyenler',
    breadcrumbs: ['Ana Ekran', 'Akademisyenler'],
  },
};

const resolvePageMeta = (pathname: string) => {
  if (pathname.includes('/profile')) {
    return pageMeta.profile;
  }
  if (pathname.includes('/super-admin/fakulteler') && !pathname.match(/^\/super-admin\/fakulteler\/[a-f0-9-]+$/i)) {
    return pageMeta.faculties;
  }
  if (pathname.includes('/super-admin/bolumler') && !pathname.match(/^\/super-admin\/bolumler\/[a-f0-9-]+$/i)) {
    return pageMeta.departments;
  }

  if (pathname.includes('/department-admin/academisyenler')) {
    return pageMeta.academicians;
  }

  return pageMeta.dashboard;
};

export const AppLayout = () => {
  const location = useLocation();
  const role = useAuthStore((state) => state.user?.role);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const { title, breadcrumbs, setMeta } = useHeaderStore();
  const defaultMeta = useMemo(() => resolvePageMeta(location.pathname), [location.pathname]);

  useEffect(() => {
    const isDynamicRoute =
      location.pathname.match(/^\/super-admin\/fakulteler\/[a-f0-9-]+$/i) ||
      location.pathname.match(/^\/super-admin\/bolumler\/[a-f0-9-]+$/i);
    if (!isDynamicRoute) {
      setMeta(defaultMeta.title, defaultMeta.breadcrumbs);
    }
  }, [location.pathname, defaultMeta, setMeta]);

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
        <Header title={title} breadcrumbs={breadcrumbs} onOpenSidebar={() => setMobileOpen(true)} />
        <main>
          <PageContainer>
            <Outlet />
          </PageContainer>
        </main>
      </div>
    </div>
  );
};
