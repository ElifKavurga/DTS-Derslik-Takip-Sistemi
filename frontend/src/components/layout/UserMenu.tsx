import { ChevronDown, LogOut, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/utils/cn';
import { queryClient } from '@/services/queryClient';

const roleLabels = {
  SUPER_ADMIN: 'Süper Admin',
  DEPARTMENT_ADMIN: 'Bölüm Admini',
  ACADEMICIAN: 'Akademisyen',
};

export const UserMenu = () => {
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    return () => window.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  const initials =
    user?.fullName
      ?.split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toLocaleUpperCase('tr-TR') ?? 'D';

  const handleLogout = () => {
    logout();
    sessionStorage.clear();
    localStorage.clear();
    queryClient.clear();
    setOpen(false);
    navigate('/giris', { replace: true });
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-xl border border-slate-200/50 bg-white p-1 pr-3 text-left shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-[#006482]/10"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="flex h-7.5 w-7.5 items-center justify-center rounded-full bg-[#006482] text-xs font-semibold text-white shadow-sm">
          {initials}
        </span>
        <span className="hidden min-w-0 sm:block">
          <span className="block max-w-[130px] truncate text-xs font-bold text-slate-800">
            {user?.fullName ?? 'DTS Kullanıcısı'}
          </span>
          <span className="block text-[9px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
            {user?.role ? roleLabels[user.role] : 'Kullanıcı'}
          </span>
        </span>
        <ChevronDown className={cn('h-3.5 w-3.5 text-slate-400 transition ml-0.5', open && 'rotate-180')} />
      </button>

      {open && (
        <div
          className="absolute right-0 z-30 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] animate-in fade-in slide-in-from-top-1 duration-150"
          role="menu"
        >
          <div className="border-b border-slate-100 px-4 py-3 bg-slate-50/40">
            <p className="truncate text-xs font-bold text-slate-900">
              {user?.fullName ?? 'DTS Kullanıcısı'}
            </p>
            <p className="mt-0.5 truncate text-[10px] text-slate-500">{user?.email}</p>
          </div>

          <div className="p-1">
            <Link
              to="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100/60 hover:text-slate-900"
              role="menuitem"
            >
              <User className="h-3.5 w-3.5 text-slate-400" />
              Hesap Ayarları
            </Link>
          </div>

          <div className="border-t border-slate-100 p-1 bg-slate-50/20">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
              role="menuitem"
            >
              <LogOut className="h-3.5 w-3.5" />
              Çıkış Yap
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
