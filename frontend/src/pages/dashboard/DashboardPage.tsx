import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Building2,
  BookOpen,
  GitBranch,
  GraduationCap,
  Landmark,
  Layers,
  MapPinned,
  Plus,
  Shield,
  Users,
  Info,
  Calendar,
} from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageTitle } from '@/components/layout/PageTitle';
import { dashboardService } from '@/services/dashboardService';
import { useAuthStore } from '@/store/useAuthStore';
import { Role } from '@/types';

const roleLabels: Record<Role, string> = {
  SUPER_ADMIN: 'Süper Admin',
  DEPARTMENT_ADMIN: 'Bölüm Admini',
  ACADEMICIAN: 'Akademisyen',
};

const roleBadgeClasses: Record<Role, string> = {
  SUPER_ADMIN: 'bg-red-50 text-red-700 border-red-100',
  DEPARTMENT_ADMIN: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  ACADEMICIAN: 'bg-emerald-50 text-emerald-700 border-emerald-100',
};

export const DashboardPage = () => {
  const role = useAuthStore((state) => state.user?.role);

  if (!role) {
    return (
      <div className="space-y-3">
        <div className="h-24 w-full animate-pulse rounded-2xl bg-slate-100" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />
        </div>
      </div>
    );
  }

  if (role === 'DEPARTMENT_ADMIN') {
    return <DepartmentAdminDashboard />;
  }

  if (role === 'ACADEMICIAN') {
    return (
      <EmptyState
        title="Ana ekran hazirlaniyor"
        description="Akademisyen ana ekrani sonraki sprintlerde etkinlestirilecek."
      />
    );
  }

  return <SuperAdminDashboard />;
};

const DepartmentAdminDashboard = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['departmentAdminDashboard'],
    queryFn: dashboardService.getDepartmentAdminDashboard,
  });

  const statCards = [
    {
      label: 'Akademisyen Sayisi',
      value: data?.academicianCount ?? 0,
      icon: GraduationCap,
      colorClass: 'text-emerald-600 bg-emerald-50',
      emptyText: 'Henuz akademisyen bulunmuyor.',
    },
    {
      label: 'Ders Sayisi',
      value: data?.courseCount ?? 0,
      icon: BookOpen,
      colorClass: 'text-[#006482] bg-[#eff8ff]',
      emptyText: 'Henuz ders bulunmuyor.',
    },
  ];

  if (error) {
    return (
      <div className="dts-card py-12 text-center">
        <h3 className="text-lg font-bold text-red-600">Bolum bilgileri yuklenemedi.</h3>
        <p className="mt-2 text-sm text-slate-500">Lutfen daha sonra tekrar deneyiniz.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="dts-card relative overflow-hidden px-6 py-6">
        <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#004b62] via-[#006482] to-[#fabc07]" />
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Bolum kapsami</p>
            {isLoading ? (
              <div className="space-y-3">
                <div className="h-8 w-72 max-w-full animate-pulse rounded-lg bg-slate-100" />
                <div className="h-4 w-48 animate-pulse rounded-lg bg-slate-100" />
              </div>
            ) : (
              <>
                <h2 className="break-words text-2xl font-bold tracking-tight text-slate-900">
                  {data?.departmentName}
                </h2>
                <p className="text-sm font-medium text-slate-500">{data?.facultyName}</p>
              </>
            )}
          </div>
          <div className="inline-flex w-fit items-center rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
            Bolum Admini
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <PageTitle
          title="Ana Ekran"
          description="Yetkili oldugunuz bolume ait guncel ozet."
        />

        <div className="grid gap-4 sm:grid-cols-2">
          {statCards.map((stat) => {
            const Icon = stat.icon;

            return (
              <article key={stat.label} className="dts-card dts-card-hover p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{stat.label}</p>
                    {isLoading ? (
                      <div className="mt-3.5 h-8 w-16 animate-pulse rounded-lg bg-slate-100" />
                    ) : (
                      <>
                        <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{stat.value}</p>
                        {stat.value === 0 && <p className="mt-1 text-xs text-slate-400">{stat.emptyText}</p>}
                      </>
                    )}
                  </div>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.colorClass}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {!isLoading && data?.academicianCount === 0 && data?.courseCount === 0 && (
        <EmptyState
          title="Bolum verisi henuz bos"
          description="Bu bolume ait akademisyen veya ders kaydi eklendiginde ozet burada gorunecek."
        />
      )}
    </div>
  );
};

const SuperAdminDashboard = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: dashboardService.getStats,
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const stats = data?.stats;

  const statCards = [
    {
      label: 'Toplam Fakülte',
      value: stats?.totalFaculties ?? 0,
      icon: Landmark,
      colorClass: 'text-[#006482] bg-[#eff8ff]',
    },
    {
      label: 'Toplam Bina',
      value: stats?.totalBuildings ?? 0,
      icon: Building2,
      colorClass: 'text-[#006482] bg-[#eff8ff]',
    },
    {
      label: 'Toplam Kat',
      value: stats?.totalFloors ?? 0,
      icon: Layers,
      colorClass: 'text-[#006482] bg-[#eff8ff]',
    },
    {
      label: 'Toplam Bölüm',
      value: stats?.totalDepartments ?? 0,
      icon: GitBranch,
      colorClass: 'text-[#006482] bg-[#eff8ff]',
    },
    {
      label: 'Toplam Derslik',
      value: stats?.totalClassrooms ?? 0,
      icon: MapPinned,
      colorClass: 'text-amber-600 bg-amber-50',
    },
    {
      label: 'Toplam Akademisyen',
      value: stats?.totalAcademicians ?? 0,
      icon: GraduationCap,
      colorClass: 'text-emerald-600 bg-emerald-50',
    },
    {
      label: 'Toplam Bölüm Admini',
      value: stats?.totalDepartmentAdmins ?? 0,
      icon: Shield,
      colorClass: 'text-indigo-600 bg-indigo-50',
    },
    {
      label: 'Toplam Kullanıcı',
      value: stats?.totalUsers ?? 0,
      icon: Users,
      colorClass: 'text-slate-600 bg-slate-50',
    },
  ];

  if (error) {
    return (
      <div className="dts-card py-12 text-center">
        <h3 className="text-lg font-bold text-red-600">Veriler Yüklenirken Bir Hata Oluştu</h3>
        <p className="mt-2 text-sm text-slate-500">Lütfen daha sonra tekrar deneyiniz.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Hoş Geldiniz & Sistem Bilgilendirme Kartı */}
      <section className="dts-card relative overflow-hidden py-5 px-6">
        <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#004b62] via-[#006482] to-[#fabc07]" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Süper Admin Paneli 👋</h2>
            <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
              Derslik Takip Sistemi (DTS) yönetim paneline hoş geldiniz. Buradan fakülte, bina, derslik ve kullanıcı tanımlamalarını kolayca yönetebilirsiniz.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-amber-50/70 border border-amber-100 rounded-2xl p-3.5 max-w-md">
            <Info className="h-5 w-5 text-amber-600 shrink-0" />
            <p className="text-[11px] font-medium leading-normal text-amber-800">
              <strong className="font-bold">Önemli Başlangıç:</strong> Sistemi kullanmaya başlamak için önce fakülteleri oluşturun. Daha sonra sırasıyla bina, kat, bölüm ve derslik tanımlamalarını yapabilirsiniz.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Hızlı İşlemler Kartı */}
      <section className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Hızlı İşlemler</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <Link
            to="/super-admin/fakulteler"
            className="dts-card dts-card-hover flex items-center justify-between p-4 group transition-colors hover:border-[#006482]/40"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eff8ff] text-[#006482] group-hover:bg-[#006482] group-hover:text-white transition duration-200">
                <Landmark className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-800">Fakülte Ekle</p>
                <p className="text-[10px] text-slate-400">Yeni bir fakülte tanımla</p>
              </div>
            </div>
            <Plus className="h-4 w-4 text-slate-400 group-hover:text-slate-800 transition duration-200" />
          </Link>

          <Link
            to="/super-admin/dersler"
            className="dts-card dts-card-hover flex items-center justify-between p-4 group transition-colors hover:border-[#006482]/40"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eff8ff] text-[#006482] group-hover:bg-[#006482] group-hover:text-white transition duration-200">
                <BookOpen className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-800">Ders Ekle</p>
                <p className="text-[10px] text-slate-400">Yeni bir ders tanımla</p>
              </div>
            </div>
            <Plus className="h-4 w-4 text-slate-400 group-hover:text-slate-800 transition duration-200" />
          </Link>

          <Link
            to="/super-admin/kullanicilar"
            className="dts-card dts-card-hover flex items-center justify-between p-4 group transition-colors hover:border-[#006482]/40"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eff8ff] text-[#006482] group-hover:bg-[#006482] group-hover:text-white transition duration-200">
                <Users className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-800">Kullanıcı Ekle</p>
                <p className="text-[10px] text-slate-400">Sisteme yeni kullanıcı kaydet</p>
              </div>
            </div>
            <Plus className="h-4 w-4 text-slate-400 group-hover:text-slate-800 transition duration-200" />
          </Link>
        </div>
      </section>

      {/* 3. İstatistik Kartları */}
      <section className="space-y-3">
        <PageTitle
          title="Genel Bakış"
          description="Sistemdeki kampüs ve kullanıcı birimlerinin genel metrikleri."
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;

            return (
              <article
                key={stat.label}
                className="dts-card dts-card-hover group p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{stat.label}</p>
                    {isLoading ? (
                      <div className="mt-3.5 h-8 w-16 animate-pulse rounded-lg bg-slate-100" />
                    ) : (
                      <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                        {stat.value}
                      </p>
                    )}
                  </div>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 ${stat.colorClass} group-hover:scale-105`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* 4. Son Eklenen Kayıtlar */}
      <section className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Son Eklenen Kayıtlar</h3>
        
        <div className="grid gap-6 xl:grid-cols-3">
          {/* Son Eklenen Fakülteler */}
          <div className="dts-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Landmark className="h-4.5 w-4.5 text-[#006482]" />
                Son Eklenen Fakülteler
              </h4>
            </div>
            
            {isLoading ? (
              <div className="space-y-2.5">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-10 w-full animate-pulse rounded-xl bg-slate-50" />
                ))}
              </div>
            ) : !data?.recentFaculties?.length ? (
              <p className="text-xs text-slate-400 py-4 text-center">Fakülte kaydı bulunmuyor.</p>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto pr-1">
                {data.recentFaculties.map((faculty) => (
                  <div key={faculty.id} className="py-3 flex justify-between items-center gap-2 first:pt-0 last:pb-0">
                    <div>
                      <p className="text-xs font-semibold text-slate-800 truncate max-w-[180px]">{faculty.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Kod: {faculty.code}</p>
                    </div>
                    <span className="text-[9px] text-slate-400 font-medium flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(faculty.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Son Eklenen Binalar */}
          <div className="dts-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Building2 className="h-4.5 w-4.5 text-[#006482]" />
                Son Eklenen Binalar
              </h4>
            </div>
            
            {isLoading ? (
              <div className="space-y-2.5">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-10 w-full animate-pulse rounded-xl bg-slate-50" />
                ))}
              </div>
            ) : !data?.recentBuildings?.length ? (
              <p className="text-xs text-slate-400 py-4 text-center">Bina kaydı bulunmuyor.</p>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto pr-1">
                {data.recentBuildings.map((building) => (
                  <div key={building.id} className="py-3 flex justify-between items-center gap-2 first:pt-0 last:pb-0">
                    <div>
                      <p className="text-xs font-semibold text-slate-800 truncate max-w-[180px]">{building.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[180px]">{building.facultyName}</p>
                    </div>
                    <span className="text-[9px] text-slate-400 font-medium flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(building.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Son Eklenen Kullanıcılar */}
          <div className="dts-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Users className="h-4.5 w-4.5 text-[#006482]" />
                Son Eklenen Kullanıcılar
              </h4>
            </div>
            
            {isLoading ? (
              <div className="space-y-2.5">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-10 w-full animate-pulse rounded-xl bg-slate-50" />
                ))}
              </div>
            ) : !data?.recentUsers?.length ? (
              <p className="text-xs text-slate-400 py-4 text-center">Kullanıcı kaydı bulunmuyor.</p>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto pr-1">
                {data.recentUsers.map((user) => (
                  <div key={user.id} className="py-3 flex justify-between items-center gap-2 first:pt-0 last:pb-0">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-800 truncate">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold border ${roleBadgeClasses[user.role]}`}>
                        {roleLabels[user.role]}
                      </span>
                      <span className="text-[9px] text-slate-400 font-medium flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(user.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
