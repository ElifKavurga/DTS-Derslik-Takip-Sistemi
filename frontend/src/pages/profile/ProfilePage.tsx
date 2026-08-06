import { Mail, ShieldCheck, User } from 'lucide-react';
import { PageTitle } from '@/components/layout/PageTitle';
import { useAuthStore } from '@/store/useAuthStore';

const roleLabels = {
  SUPER_ADMIN: 'Süper Admin',
  DEPARTMENT_ADMIN: 'Bölüm Admini',
  ACADEMICIAN: 'Akademisyen',
};

export const ProfilePage = () => {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="space-y-5">
      <PageTitle title="Profil" description="Hesap bilgilerinizi ve rolünüzü buradan görüntüleyebilirsiniz." />

      <section className="dts-card p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#006482] text-lg font-semibold text-white">
            {user?.fullName
              ?.split(' ')
              .filter(Boolean)
              .slice(0, 2)
              .map((part) => part[0])
              .join('')
              .toLocaleUpperCase('tr-TR') ?? 'D'}
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900">{user?.fullName ?? 'DTS Kullanıcısı'}</h2>
            <p className="mt-0.5 text-xs text-slate-500">{user?.email}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200/60 bg-slate-50/30 p-4">
            <User className="h-4 w-4 text-[#006482]" />
            <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Ad Soyad</p>
            <p className="mt-1 text-xs font-semibold text-slate-800">{user?.fullName ?? '-'}</p>
          </div>
          <div className="rounded-xl border border-slate-200/60 bg-slate-50/30 p-4">
            <Mail className="h-4 w-4 text-[#006482]" />
            <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">E-posta</p>
            <p className="mt-1 truncate text-xs font-semibold text-slate-800">{user?.email ?? '-'}</p>
          </div>
          <div className="rounded-xl border border-slate-200/60 bg-slate-50/30 p-4">
            <ShieldCheck className="h-4 w-4 text-[#006482]" />
            <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Rol</p>
            <p className="mt-1 text-xs font-semibold text-slate-800">
              {user?.role ? roleLabels[user.role] : '-'}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
