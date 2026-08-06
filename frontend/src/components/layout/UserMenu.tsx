import { ChevronDown, KeyRound, LogOut, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/utils/cn';

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
    setOpen(false);
    navigate('/giris', { replace: true });
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-3 rounded-xl border border-slate-200/60 bg-white px-2.5 py-1.5 text-left shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-[#006482]/10"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#006482] text-xs font-semibold text-white">
          {initials}
        </span>
        <span className="hidden min-w-0 sm:block">
          <span className="block max-w-[140px] truncate text-xs font-semibold text-slate-900">
            {user?.fullName ?? 'DTS Kullanıcısı'}
          </span>
          <span className="block text-[10px] font-medium text-slate-400">
            {user?.role ? roleLabels[user.role] : 'Kullanıcı'}
          </span>
        </span>
        <ChevronDown className={cn('h-3.5 w-3.5 text-slate-400 transition', open && 'rotate-180')} />
      </button>

      {open && (
        <div
          className="absolute right-0 z-30 mt-2 w-60 overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-[0_12px_36px_rgba(15,23,42,0.08)] animate-in fade-in slide-in-from-top-1 duration-150"
          role="menu"
        >
          <div className="border-b border-slate-100 px-4 py-3 bg-slate-50/50">
            <p className="truncate text-sm font-semibold text-slate-900">
              {user?.fullName ?? 'DTS Kullanıcısı'}
            </p>
            <p className="mt-0.5 truncate text-xs text-slate-400">{user?.email}</p>
            <span className="mt-2 inline-flex rounded-full bg-[#eff8ff] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#006482]">
              {user?.role ? roleLabels[user.role] : 'Kullanıcı'}
            </span>
          </div>

          <div className="p-1.5">
            <Link
              to="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
              role="menuitem"
            >
              <User className="h-4 w-4 text-slate-400" />
              Profil
            </Link>
            <button
              type="button"
              disabled
              className="flex w-full cursor-not-allowed items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-medium text-slate-400"
              role="menuitem"
            >
              <KeyRound className="h-4 w-4 text-slate-300" />
              Şifre Değiştir
              <span className="ml-auto rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-400">
                Yakında
              </span>
            </button>
          </div>

          <div className="border-t border-slate-100 p-1.5 bg-slate-50/30">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50/80"
              role="menuitem"
            >
              <LogOut className="h-4 w-4" />
              Çıkış Yap
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
