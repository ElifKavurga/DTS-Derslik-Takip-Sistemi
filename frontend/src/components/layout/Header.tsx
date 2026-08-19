import { useQuery } from '@tanstack/react-query';
import { Bell, Menu, Search } from 'lucide-react';
import { MouseEvent, useEffect, useRef, useState } from 'react';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { GlobalSearchPanel } from '@/components/layout/GlobalSearchPanel';
import { NotificationPanel } from '@/components/layout/NotificationPanel';
import { UserMenu } from '@/components/layout/UserMenu';
import { notificationService } from '@/services/notificationService';
import { useAuthStore } from '@/store/useAuthStore';

type HeaderProps = {
  title: string;
  breadcrumbs: string[];
  onOpenSidebar: () => void;
};

export const Header = ({ title, breadcrumbs, onOpenSidebar }: HeaderProps) => {
  const role = useAuthStore((state) => state.user?.role);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const headerActionsRef = useRef<HTMLDivElement>(null);

  const { data: unreadCountData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: notificationService.getUnreadCount,
    refetchInterval: 60000,
  });

  const unreadCount = unreadCountData?.count ?? 0;

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!headerActionsRef.current?.contains(event.target as Node)) {
        setIsSearchOpen(false);
        setIsNotificationsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSearchOpen(false);
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const stopPanelClick = (event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/30 bg-white/60 backdrop-blur-md">
      <div className="flex h-14 items-center gap-4 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-950 lg:hidden"
          aria-label="Menüyü aç"
        >
          <Menu className="h-4.5 w-4.5" />
        </button>

        <div className="min-w-0 flex-1">
          <Breadcrumb items={breadcrumbs} />
        </div>

        <div ref={headerActionsRef} className="relative flex items-center gap-2" onClick={stopPanelClick}>
          <button
            type="button"
            onClick={() => {
              setIsSearchOpen((value) => !value);
              setIsNotificationsOpen(false);
            }}
            className={`flex h-9 w-9 items-center justify-center rounded-xl border transition ${
              isSearchOpen
                ? 'border-[#006482]/20 bg-[#006482]/10 text-[#006482]'
                : 'border-slate-200/60 bg-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
            aria-label="Arama"
            aria-expanded={isSearchOpen}
          >
            <Search className="h-4.5 w-4.5" />
          </button>

          <button
            type="button"
            onClick={() => {
              setIsNotificationsOpen((value) => !value);
              setIsSearchOpen(false);
            }}
            className={`relative flex h-9 w-9 items-center justify-center rounded-xl border transition ${
              isNotificationsOpen
                ? 'border-[#006482]/20 bg-[#006482]/10 text-[#006482]'
                : 'border-slate-200/60 bg-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
            aria-label="Bildirimler"
            aria-expanded={isNotificationsOpen}
          >
            <Bell className="h-4.5 w-4.5" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-[#FAB900] px-1.5 py-0.5 text-[10px] font-extrabold leading-none text-[#102033] shadow-sm">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {isSearchOpen && <GlobalSearchPanel role={role} onClose={() => setIsSearchOpen(false)} />}
          {isNotificationsOpen && <NotificationPanel onClose={() => setIsNotificationsOpen(false)} />}
        </div>

        <UserMenu />
      </div>
    </header>
  );
};
