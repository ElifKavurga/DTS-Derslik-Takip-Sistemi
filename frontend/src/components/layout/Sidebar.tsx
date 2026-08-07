import { useState } from 'react';
import {
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  GitBranch,
  Landmark,
  Layers,
  LayoutDashboard,
  Map,
  User,
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
  path?: string;
  icon: typeof LayoutDashboard;
  roles?: Role[];
  disabled?: boolean;
};

const primaryNavigation: NavigationItem[] = [
  {
    label: 'Ana Ekran',
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
    icon: User,
    roles: ['SUPER_ADMIN'],
  },
];

// Gelecek sprintlerde aktifleşecek modüller
const upcomingNavigation: NavigationItem[] = [
  /*
  {
    label: 'Kampüs Yönetimi',
    icon: Map,
    roles: ['SUPER_ADMIN'],
    disabled: true,
  },
  {
    label: 'Fiziksel Kampüs',
    icon: Building2,
    roles: ['SUPER_ADMIN', 'DEPARTMENT_ADMIN'],
    disabled: true,
  },
  {
    label: 'Akademik Planlama',
    icon: GraduationCap,
    roles: ['SUPER_ADMIN', 'DEPARTMENT_ADMIN'],
    disabled: true,
  },
  {
    label: 'Rezervasyonlar',
    icon: CalendarClock,
    roles: ['SUPER_ADMIN', 'DEPARTMENT_ADMIN', 'ACADEMICIAN'],
    disabled: true,
  },
  {
    label: 'Görüntüleme',
    icon: Eye,
    roles: ['SUPER_ADMIN', 'DEPARTMENT_ADMIN', 'ACADEMICIAN'],
    disabled: true,
  },
  */
];

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
  const visibleUpcomingNavigation = upcomingNavigation.filter((item) => canShowItem(item, role));
  const [campusExpanded, setCampusExpanded] = useState(false);

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
        {/* Floating Circular Collapse Toggle Button */}
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
            {primaryNavigation.map((item) => {
              const Icon = item.icon;
              const path = item.path ?? dashboardPath;

              return (
                <NavLink
                  key={item.label}
                  to={path}
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

            {/* Kampüs Yönetimi Dropdown (Süper Admin) */}
            {role === 'SUPER_ADMIN' && (
              <div className="space-y-1 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (collapsed) {
                      onToggleCollapsed();
                      setCampusExpanded(true);
                    } else {
                      setCampusExpanded(!campusExpanded);
                    }
                  }}
                  className={cn(
                    'group flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-slate-600 transition duration-150 hover:bg-slate-100/70 hover:text-slate-900',
                    campusExpanded && !collapsed && 'text-slate-900 font-semibold'
                  )}
                  title={collapsed ? 'Kampüs Yönetimi' : undefined}
                >
                  <Map className="h-4.5 w-4.5 shrink-0" />
                  <span className={cn('truncate text-left flex-1', collapsed && 'lg:hidden')}>Kampüs Yönetimi</span>
                  {!collapsed && (
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 shrink-0 transition-transform duration-200 text-slate-400 group-hover:text-slate-900',
                        campusExpanded && 'rotate-180 text-slate-900'
                      )}
                    />
                  )}
                </button>

                {campusExpanded && !collapsed && (
                  <div className="pl-6 space-y-1 mt-1 transition-all duration-300">
                    <NavLink
                      to="/super-admin/fakulteler"
                      onClick={onCloseMobile}
                      className={({ isActive }) =>
                        cn(
                          'group flex h-9 items-center gap-2.5 rounded-xl px-3 text-[13px] font-medium transition duration-150',
                          isActive
                            ? 'bg-[#eff8ff] text-[#006482] font-semibold'
                            : 'text-slate-500 hover:bg-slate-100/50 hover:text-slate-900',
                        )
                      }
                    >
                      <Landmark className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-[#006482]" />
                      <span>Fakülte Yönetimi</span>
                    </NavLink>
                    <div className="group flex h-9 items-center gap-2.5 rounded-xl px-3 text-[13px] font-medium text-slate-400 opacity-60 cursor-not-allowed select-none">
                      <Building2 className="h-4 w-4 shrink-0 text-slate-300" />
                      <span>Bina Yönetimi</span>
                      <span className="ml-auto rounded-full bg-slate-100 px-1.5 py-0.5 text-[8px] font-semibold text-slate-400">Yakında</span>
                    </div>
                    <div className="group flex h-9 items-center gap-2.5 rounded-xl px-3 text-[13px] font-medium text-slate-400 opacity-60 cursor-not-allowed select-none">
                      <Layers className="h-4 w-4 shrink-0 text-slate-300" />
                      <span>Kat Yönetimi</span>
                      <span className="ml-auto rounded-full bg-slate-100 px-1.5 py-0.5 text-[8px] font-semibold text-slate-400">Yakında</span>
                    </div>
                    <div className="group flex h-9 items-center gap-2.5 rounded-xl px-3 text-[13px] font-medium text-slate-400 opacity-60 cursor-not-allowed select-none">
                      <GitBranch className="h-4 w-4 shrink-0 text-slate-300" />
                      <span>Bölüm Yönetimi</span>
                      <span className="ml-auto rounded-full bg-slate-100 px-1.5 py-0.5 text-[8px] font-semibold text-slate-400">Yakında</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {visibleUpcomingNavigation.length > 0 && (
            <div className="mt-7">
              <p
                className={cn(
                  'px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400',
                  collapsed && 'lg:hidden',
                )}
              >
                Modüller
              </p>
              <div className="mt-3 space-y-1">
                {visibleUpcomingNavigation.map((item) => {
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.label}
                      type="button"
                      disabled={item.disabled}
                      className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium text-slate-400 transition hover:bg-slate-100/70 disabled:cursor-not-allowed"
                      title={collapsed ? `${item.label} - Yakında` : undefined}
                    >
                      <Icon className="h-4.5 w-4.5 shrink-0" />
                      <span className={cn('truncate', collapsed && 'lg:hidden')}>{item.label}</span>
                      <span
                        className={cn(
                          'ml-auto rounded-full border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[9px] font-semibold text-slate-400',
                          collapsed && 'lg:hidden',
                        )}
                      >
                        Yakında
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </nav>
      </aside>
    </>
  );
};
