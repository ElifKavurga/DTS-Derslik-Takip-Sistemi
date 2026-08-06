import { Bell, Menu, Search } from 'lucide-react';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { UserMenu } from '@/components/layout/UserMenu';

type HeaderProps = {
  title: string;
  breadcrumbs: string[];
  onOpenSidebar: () => void;
};

export const Header = ({ title, breadcrumbs, onOpenSidebar }: HeaderProps) => {
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
          <h1 className="mt-0.5 truncate text-base font-semibold tracking-tight text-slate-900">{title}</h1>
        </div>

        <button
          type="button"
          disabled
          className="hidden h-9 w-9 cursor-not-allowed items-center justify-center rounded-xl border border-slate-200/60 bg-transparent text-slate-400 sm:flex"
          aria-label="Arama"
          title="Yakında"
        >
          <Search className="h-4.5 w-4.5" />
        </button>

        <button
          type="button"
          disabled
          className="relative flex h-9 w-9 cursor-not-allowed items-center justify-center rounded-xl border border-slate-200/60 bg-transparent text-slate-400"
          aria-label="Bildirimler"
          title="Yakında"
        >
          <Bell className="h-4.5 w-4.5" />
          <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-[#fabc07]" />
        </button>

        <UserMenu />
      </div>
    </header>
  );
};
