import React from 'react';
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
  Clock,
  CheckCircle2,
  MapPin,
  ArrowRight,
  AlertCircle,
  Ban,
  CalendarPlus,
  RefreshCw,
} from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageTitle } from '@/components/layout/PageTitle';
import { cn } from '@/utils/cn';
import { dashboardService } from '@/services/dashboardService';
import { scheduleExceptionService } from '@/services/scheduleExceptionService';
import { useAuthStore } from '@/store/useAuthStore';
import { CourseResponse, Role, ScheduleExceptionResponse } from '@/types';

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
    return <AcademicianDashboard />;
  }

  return <SuperAdminDashboard />;
};

const DepartmentAdminDashboard = () => {
  const [selectedSemester, setSelectedSemester] = React.useState<string>('GUZ');
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['departmentAdminDashboard', selectedSemester],
    queryFn: () => dashboardService.getDepartmentAdminDashboard(selectedSemester),
  });

  const statCards = [
    {
      label: 'Toplam Ders',
      value: data?.courseCount ?? 0,
      icon: BookOpen,
      colorClass: 'text-[#006482] bg-[#eff8ff]',
      emptyText: 'Henuz ders bulunmuyor.',
    },
    {
      label: 'Akademisyen',
      value: data?.academicianCount ?? 0,
      icon: GraduationCap,
      colorClass: 'text-emerald-600 bg-emerald-50',
      emptyText: 'Henuz akademisyen bulunmuyor.',
    },
    {
      label: 'Derslik',
      value: data?.classroomCount ?? 0,
      icon: MapPinned,
      colorClass: 'text-amber-600 bg-amber-50',
      emptyText: 'Derslik bulunmuyor.',
    },
    {
      label: 'Programlanan Ders',
      value: data?.scheduleSummary?.completedCourses ?? 0,
      icon: Calendar,
      colorClass: 'text-indigo-600 bg-indigo-50',
      emptyText: 'Programlanan ders yok.',
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

  const completionPercentage = data?.scheduleSummary?.completionPercentage ?? 0;
  const incompleteOrNotScheduled = data?.scheduleSummary?.courses.filter(
    (c) => c.status === 'INCOMPLETE' || c.status === 'NOT_SCHEDULED'
  ) || [];

  return (
    <div className="space-y-6">
      <section className="dts-card relative overflow-hidden border-[#006482]/15 bg-gradient-to-br from-[#eff8ff] via-white to-white px-6 py-6 shadow-md">
        <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#004b62] via-[#006482] to-[#fabc07]" />
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0 space-y-2 flex-1">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Ana Ekran</p>
            {isLoading ? (
              <div className="space-y-3">
                <div className="h-8 w-72 max-w-full animate-pulse rounded-lg bg-slate-100" />
                <div className="h-4 w-48 animate-pulse rounded-lg bg-slate-100" />
              </div>
            ) : (
              <>
                <h2 className="break-words text-2xl font-bold tracking-tight text-slate-900">
                  {data?.departmentName} Bölümü
                </h2>
                <p className="text-sm font-medium text-slate-500">{data?.facultyName}</p>
              </>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#006482]/20"
            >
              <option value="GUZ">Güz Dönemi</option>
              <option value="BAHAR">Bahar Dönemi</option>
              <option value="YAZ_OKULU">Yaz Okulu</option>
            </select>
            <div className="inline-flex w-fit items-center rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
              Bolum Admini
            </div>
          </div>
        </div>
      </section>

      {/* İstatistikler */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                      {stat.value === 0 && <p className="mt-1 text-[10px] text-slate-400">{stat.emptyText}</p>}
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
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Ders Programı Durumu */}
          <section className="dts-card p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-800">Ders Programı Durumu</h3>
            {isLoading ? (
               <div className="h-16 animate-pulse rounded-lg bg-slate-100" />
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-slate-900">{completionPercentage}%</p>
                    <p className="text-xs text-slate-500">Tamamlanma Oranı</p>
                  </div>
                  <div className="text-right text-xs space-y-1 text-slate-600">
                    <p><span className="text-emerald-600 font-bold">✓ Tamamlanan:</span> {data?.scheduleSummary?.completedCourses ?? 0}</p>
                    <p><span className="text-amber-600 font-bold">⚠ Eksik:</span> {data?.scheduleSummary?.incompleteCourses ?? 0}</p>
                    <p><span className="text-slate-400 font-bold">○ Programlanmamış:</span> {data?.scheduleSummary?.notScheduledCourses ?? 0}</p>
                  </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3">
                  <div 
                    className="bg-[#006482] h-3 rounded-full transition-all duration-500" 
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
              </div>
            )}
          </section>

          {/* Eksik Programlar */}
          <section className="dts-card p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-800">Eksik / Programlanmamış Dersler</h3>
              <Link to="/bolum-admin/ders-programi" className="text-xs font-bold text-[#006482] hover:underline">Tümünü Gör</Link>
            </div>
            
            {isLoading ? (
               <div className="space-y-2">
                 <div className="h-12 animate-pulse rounded-lg bg-slate-100" />
                 <div className="h-12 animate-pulse rounded-lg bg-slate-100" />
               </div>
            ) : incompleteOrNotScheduled.length === 0 ? (
              <p className="text-xs text-slate-500 py-2">Harika! Tüm dersler programlanmış.</p>
            ) : (
              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                {incompleteOrNotScheduled.slice(0, 5).map((course) => (
                  <div key={course.courseId} className="flex justify-between items-center p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="text-xs font-bold text-slate-800">{course.courseCode} - {course.courseName}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{course.status === 'NOT_SCHEDULED' ? 'Hiç programlanmamış' : `${course.remainingHours} saat eksik`}</p>
                    </div>
                    <Link to="/bolum-admin/ders-programi" className="px-3 py-1.5 bg-white border border-slate-200 rounded-md text-[10px] font-bold text-slate-700 hover:bg-slate-50 transition-colors">
                      Programa Git
                    </Link>
                  </div>
                ))}
                {incompleteOrNotScheduled.length > 5 && (
                  <p className="text-[10px] text-center text-slate-400 pt-2">+ {incompleteOrNotScheduled.length - 5} ders daha</p>
                )}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          {/* Uyarılar */}
          {data?.warnings && data.warnings.length > 0 && (
            <section className="dts-card p-5 bg-amber-50/50 border border-amber-100 space-y-3">
              <h3 className="text-xs font-bold text-amber-800 flex items-center gap-2">
                <Info className="w-4 h-4" />
                DİKKAT GEREKENLER
              </h3>
              <ul className="space-y-2">
                {data.warnings.map((warning, idx) => (
                  <li key={idx} className="text-xs text-amber-700 flex items-start gap-1.5">
                    <span className="text-amber-500 mt-0.5">⚠</span>
                    {warning}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Hızlı İşlemler */}
          <section className="dts-card p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Hızlı İşlemler</h3>
            <div className="grid gap-2">
              <Link to="/bolum-admin/ders-programi" className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-[#006482]/30 hover:bg-slate-50 transition-colors group">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-slate-800">Ders Programı</p>
                </div>
              </Link>
              <Link to="/bolum-admin/dersler" className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-[#006482]/30 hover:bg-slate-50 transition-colors group">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-slate-800">Dersler</p>
                </div>
              </Link>
              <Link to="/bolum-admin/akademisyenler" className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-[#006482]/30 hover:bg-slate-50 transition-colors group">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-slate-800">Akademisyenler</p>
                </div>
              </Link>
              <Link to="/bolum-admin/derslikler" className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-[#006482]/30 hover:bg-slate-50 transition-colors group">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                  <MapPinned className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-slate-800">Derslikler</p>
                </div>
              </Link>
            </div>
          </section>
        </div>
      </div>

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
      <section className="dts-card relative overflow-hidden border-[#006482]/15 bg-gradient-to-br from-[#eff8ff] via-white to-white px-6 py-5 shadow-md">
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

const AcademicianDashboard = () => {
  const [selectedSemester] = React.useState<string>('GUZ');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['academicianDashboard', selectedSemester],
    queryFn: () => dashboardService.getAcademicianDashboard(selectedSemester),
  });

  const { data: exceptions = [] } = useQuery({
    queryKey: ['scheduleExceptions', 'dashboard'],
    queryFn: () => scheduleExceptionService.getMine(),
  });

  const getDayLabel = (day: string) => {
    const labels: Record<string, string> = {
      MONDAY: 'Pazartesi',
      TUESDAY: 'Salı',
      WEDNESDAY: 'Çarşamba',
      THURSDAY: 'Perşembe',
      FRIDAY: 'Cuma',
    };
    return labels[day] || day;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="h-32 w-full animate-pulse rounded-3xl bg-slate-100/80" />
        <div className="grid gap-6 md:grid-cols-12">
          {/* Left panel Skeleton */}
          <div className="space-y-6 md:col-span-8">
            <div className="h-48 w-full animate-pulse rounded-3xl bg-slate-100/80" />
            <div className="h-64 w-full animate-pulse rounded-3xl bg-slate-100/80" />
          </div>
          {/* Right panel Skeleton */}
          <div className="space-y-6 md:col-span-4">
            <div className="h-44 w-full animate-pulse rounded-3xl bg-slate-100/80" />
            <div className="h-64 w-full animate-pulse rounded-3xl bg-slate-100/80" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h3 className="text-base font-bold text-slate-800">Yükleme Başarısız</h3>
        <p className="mt-1 text-xs text-slate-400 max-w-xs leading-normal">
          Dashboard verileri yüklenirken bir sorun oluştu. Lütfen bağlantınızı kontrol edip tekrar deneyin.
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-4 rounded-xl bg-[#006482] px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-[#00526b] transition active:scale-95"
        >
          Yeniden Dene
        </button>
      </div>
    );
  }

  const { academician, academicTerm, todayCourses = [], nextCourse, courses = [], weeklySummary = {} } = data || {};
  const upcomingExceptions = (exceptions as ScheduleExceptionResponse[]).filter((item) => new Date(`${item.targetDate}T12:00:00`) >= new Date(new Date().setHours(0, 0, 0, 0)));
  const exceptionSummary = {
    cancelled: upcomingExceptions.filter((item) => item.type === 'CANCELLED').length,
    makeup: upcomingExceptions.filter((item) => item.type === 'MAKEUP').length,
    extra: upcomingExceptions.filter((item) => item.type === 'EXTRA').length,
  };

  const todayLabel = new Date().toLocaleDateString('tr-TR', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* Dynamic greeting banner */}
      <div className="relative overflow-hidden rounded-3xl border border-[#006482]/15 bg-gradient-to-br from-[#eff8ff] via-white to-white p-6 shadow-md md:p-8">
        <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#004b62] via-[#006482] to-[#fabc07]" />
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-48 w-48 rounded-full bg-[#88d0f2]/10 blur-2xl" />
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1 rounded-full border border-[#006482]/20 bg-[#eff8ff] px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-[#006482]">
              {academicTerm}
            </span>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">
              Hoş geldiniz, {academician?.title} {academician?.firstName} {academician?.lastName}
            </h1>
            <p className="text-xs font-medium text-slate-400">
              {academician?.departmentName} · {academician?.facultyName}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2.5 rounded-2xl bg-white/70 border border-slate-100 p-3 shadow-sm backdrop-blur-sm">
            <Calendar className="h-5 w-5 text-[#006482]" />
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Bugün</p>
              <p className="text-xs font-bold text-slate-700">{todayLabel}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        {/* Left Side: Today's courses & Schedules */}
        <div className="space-y-6 md:col-span-8">
          {/* Next Class Highlight */}
          {nextCourse ? (
            <div className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50/50 to-white p-6 shadow-sm">
              <div className="absolute right-0 top-0 -mr-10 -mt-10 h-32 w-32 rounded-full bg-emerald-100/10 blur-xl" />
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-700">Sıradaki Dersiniz</h3>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[13px] font-bold text-slate-950">
                    <span>{nextCourse.courseCode} · {nextCourse.courseName}</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl bg-white border border-slate-100 p-3 shadow-xs">
                  <span className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Saat</span>
                  <span className="mt-1 block text-xs font-bold text-slate-700">{nextCourse.timeSlot}</span>
                </div>
                <div className="rounded-2xl bg-white border border-slate-100 p-3 shadow-xs">
                  <span className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Derslik</span>
                  <span className="mt-1 block text-xs font-bold text-slate-700">{nextCourse.classroomCode} · {nextCourse.classroomName}</span>
                </div>
                <div className="rounded-2xl bg-white border border-slate-100 p-3 shadow-xs">
                  <span className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Bölüm</span>
                  <span className="mt-1 block text-xs font-bold text-slate-700 truncate">{nextCourse.courseName ? academician?.departmentName : ''}</span>
                </div>
              </div>
            </div>
          ) : null}

          {/* Today's Courses List */}
          <div className="rounded-3xl border border-slate-200/60 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800">Bugünün Ders Programı</h2>
            <p className="mt-0.5 text-xs font-medium text-slate-400">Bugün vermeniz gereken derslerin listesi.</p>

            <div className="mt-4 space-y-3">
              {todayCourses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <p className="mt-2.5 text-xs font-bold text-slate-700">Bugün dersiniz bulunmuyor</p>
                  <p className="mt-0.5 text-[11px] text-slate-400">Kendinize vakit ayırabilir veya hazırlık yapabilirsiniz.</p>
                </div>
              ) : (
                todayCourses.map((course, index) => {
                  let isFinished = false;
                  try {
                    const turkeyTime = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Istanbul' }));
                    const currentHour = turkeyTime.getHours();
                    const currentMinute = turkeyTime.getMinutes();
                    const nowMinutes = currentHour * 60 + currentMinute;
                    
                    const slotEnd = course.timeSlot.split('-')[1]?.trim();
                    if (slotEnd) {
                      const endHour = parseInt(slotEnd.split(':')[0]);
                      const endMinute = parseInt(slotEnd.split(':')[1]);
                      const endMinutes = endHour * 60 + endMinute;
                      isFinished = nowMinutes > endMinutes;
                    }
                  } catch {
                    // Ignore malformed time slots from legacy records.
                  }

                  return (
                    <div
                      key={index}
                      className={cn(
                        'flex items-center gap-4 rounded-2xl border p-4 transition-all duration-200',
                        isFinished
                          ? 'border-slate-100 bg-slate-50/50 text-slate-400'
                          : 'border-slate-100 hover:border-[#88d0f2]/60 hover:shadow-md hover:shadow-slate-100'
                      )}
                    >
                      <div className={cn(
                        'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xs font-extrabold tracking-wider',
                        isFinished ? 'bg-slate-100 text-slate-400' : 'bg-[#eff8ff] text-[#006482]'
                      )}>
                        {course.timeSlot.split('-')[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            'rounded px-1.5 py-0.5 text-[9px] font-bold tracking-widest uppercase',
                            isFinished ? 'bg-slate-100 text-slate-400' : 'bg-slate-50 text-slate-500'
                          )}>
                            {course.courseCode}
                          </span>
                          {isFinished && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                              <CheckCircle2 className="h-3 w-3" /> Tamamlandı
                            </span>
                          )}
                        </div>
                        <h4 className={cn('mt-1 text-xs font-bold leading-normal truncate', isFinished ? 'text-slate-400' : 'text-slate-900')}>
                          {course.courseName}
                        </h4>
                        <p className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-slate-400">
                          <MapPin className="h-3 w-3 shrink-0" /> {course.classroomCode} · {course.classroomName}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Weekly Summary & Course list */}
        <div className="space-y-6 md:col-span-4">
          <div className="rounded-3xl border border-slate-200/60 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800">Yaklaşan Ders Değişiklikleri</h2>
                <p className="mt-0.5 text-xs font-medium text-slate-400">İptal, telafi ve ek ders kayıtlarınız.</p>
              </div>
              <RefreshCw className="h-5 w-5 shrink-0 text-[#006482]" />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <DashboardExceptionMetric label="İptal" value={exceptionSummary.cancelled} icon={<Ban className="h-4 w-4" />} tone="red" />
              <DashboardExceptionMetric label="Telafi" value={exceptionSummary.makeup} icon={<RefreshCw className="h-4 w-4" />} tone="amber" />
              <DashboardExceptionMetric label="Ek Ders" value={exceptionSummary.extra} icon={<CalendarPlus className="h-4 w-4" />} tone="emerald" />
            </div>
            <Link
              to="/academician/istisnalar"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-[#006482] hover:border-[#006482]/20 active:scale-95"
            >
              Tümünü Gör
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Weekly Summary Widget */}
          <div className="rounded-3xl border border-slate-200/60 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800">Haftalık Ders Özeti</h2>
            <p className="mt-0.5 text-xs font-medium text-slate-400">Hangi gün kaç ders saati dersiniz var.</p>

            <div className="mt-4 space-y-2">
              {['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'].map((day) => {
                const count = weeklySummary[day] ?? 0;
                return (
                  <div key={day} className="flex items-center justify-between rounded-xl border border-slate-50 p-2.5">
                    <span className="text-xs font-bold text-slate-600">{getDayLabel(day)}</span>
                    <span className={cn(
                      'inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-extrabold leading-none',
                      count > 0 ? 'bg-[#eff8ff] text-[#006482]' : 'bg-slate-50 text-slate-400'
                    )}>
                      {count > 0 ? `${count} ders` : 'Boş'}
                    </span>
                  </div>
                );
              })}
            </div>

            <Link
              to="/academician/ders-programi"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-[#006482] hover:border-[#006482]/20 active:scale-95"
            >
              Haftalık Programı Gör
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Courses Widget */}
          <div className="rounded-3xl border border-slate-200/60 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800">Verdiğim Dersler</h2>
            <p className="mt-0.5 text-xs font-medium text-slate-400">Bu dönem atandığınız aktif dersler.</p>

            <div className="mt-4 space-y-3">
              {courses.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400 font-medium">Atanmış ders bulunmuyor.</div>
              ) : (
                courses.slice(0, 3).map((course: CourseResponse, idx: number) => (
                  <div key={idx} className="flex items-start gap-3 rounded-2xl border border-slate-50 p-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500 text-xs font-bold uppercase">
                      {course.code.substring(0, 2)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="block text-[9px] font-bold tracking-widest text-[#006482] uppercase">{course.code}</span>
                      <h4 className="mt-0.5 text-xs font-bold text-slate-800 truncate" title={course.name}>{course.name}</h4>
                      <p className="mt-0.5 text-[10px] font-semibold text-slate-400">AKTS: {course.ects} · {course.theoreticalHours + course.practicalHours} saat/hafta</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {courses.length > 3 && (
              <div className="mt-2 text-center text-[10px] font-bold text-slate-400">
                +{courses.length - 3} ders daha
              </div>
            )}

            <Link
              to="/academician/dersler"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-[#006482] hover:border-[#006482]/20 active:scale-95"
            >
              Tüm Dersleri Gör
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

const DashboardExceptionMetric = ({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone: 'red' | 'amber' | 'emerald';
}) => (
  <div className={cn(
    'rounded-2xl border px-3 py-2',
    tone === 'red' ? 'border-red-100 bg-red-50 text-red-700' : tone === 'amber' ? 'border-amber-100 bg-amber-50 text-amber-700' : 'border-emerald-100 bg-emerald-50 text-emerald-700',
  )}>
    <div className="flex items-center justify-between gap-2">
      <span className="text-[10px] font-extrabold uppercase tracking-wider">{label}</span>
      {icon}
    </div>
    <p className="mt-1 text-lg font-black">{value}</p>
  </div>
);
