import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Landmark,
  LayoutDashboard,
  User,
  Users,
  X,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import dtsLogo from '@/assets/dts-logo.png';
import { getDashboardPathByRole } from '@/router/roleRoutes';
import { Role } from '@/types';
import { cn } from '@/utils/cn';

type SidebarProps = {
  collapsed: boolean;
  mobileOpen: boolean;
  role?: Role;
  onCloseMobile: () => void;
  onToggleCollapsed: () => void;
};

type NavigationItem = {
  label: string;
  path: string;
  icon: typeof LayoutDashboard;
  roles?: Role[];
};

const canShowItem = (item: NavigationItem, role?: Role) => {
  return !item.roles || (role ? item.roles.includes(role) : false);
};

export const Sidebar = ({
  collapsed,
  mobileOpen,
  role,
  onCloseMobile,
  onToggleCollapsed,
}: SidebarProps) => {
  const dashboardPath = getDashboardPathByRole(role);
  const navigationItems: NavigationItem[] = [
    {
      label: 'Ana Ekran',
      path: dashboardPath,
      icon: LayoutDashboard,
    },
    {
      label: 'Profil',
      path: '/profile',
      icon: User,
    },
    {
      label: 'Kullanıcılar',
      path: '/super-admin/kullanicilar',
      icon: Users,
      roles: ['SUPER_ADMIN'],
    },
    {
      label: 'Fakülte Yönetimi',
      path: '/super-admin/fakulteler',
      icon: Landmark,
      roles: ['SUPER_ADMIN'],
    },
    {
      label: 'Bölüm Yönetimi',
      path: '/super-admin/bolumler',
      icon: GraduationCap,
      roles: ['SUPER_ADMIN'],
    },
    {
      label: 'Dersler',
      path: role === 'SUPER_ADMIN' ? '/super-admin/dersler' : '/department-admin/dersler',
      icon: BookOpen,
      roles: ['SUPER_ADMIN', 'DEPARTMENT_ADMIN'],
    },
  ];
  const navigation = navigationItems.filter((item) => canShowItem(item, role));

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-40 bg-slate-950/20 backdrop-blur-sm transition-opacity lg:hidden',
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={onCloseMobile}
      />

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200/50 bg-[#fafbfc] transition-all duration-300 lg:translate-x-0',
          collapsed ? 'lg:w-[72px]' : 'lg:w-[260px]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          'w-[260px]',
        )}
      >
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="hidden absolute -right-3 top-[16px] z-50 h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm hover:text-slate-900 lg:flex transition duration-150"
          aria-label={collapsed ? 'Menüyü genişlet' : 'Menüyü daralt'}
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>

        <div className="flex h-14 items-center gap-3 px-4 border-b border-slate-200/40">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-100 bg-slate-50/50">
            <img src={dtsLogo} alt="DTS Logo" className="h-5 w-5 object-contain" />
          </div>
          <div className={cn('min-w-0 transition-opacity', collapsed && 'lg:hidden')}>
            <p className="text-xs font-semibold tracking-tight text-slate-900">DTS</p>
            <p className="truncate text-[10px] text-slate-400">Derslik Takip Sistemi</p>
          </div>
          <button
            type="button"
            className="ml-auto rounded-xl p-1 text-slate-400 transition hover:bg-slate-50 hover:text-slate-900 lg:hidden"
            onClick={onCloseMobile}
            aria-label="Menüyü kapat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <div className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.label}
                  to={item.path}
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    cn(
                      'group flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium transition duration-150',
                      isActive
                        ? 'bg-[#006482] text-white font-semibold shadow-[0_4px_12px_rgba(0,100,130,0.16)]'
                        : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900',
                    )
                  }
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="h-4.5 w-4.5 shrink-0" />
                  <span className={cn('truncate', collapsed && 'lg:hidden')}>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </nav>
      </aside>
    </>
  );
};
