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
};const SemesterDropdown = ({ value, onChange }: { value: string; onChange: (val: string) => void }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const options = [
    { value: 'GUZ', label: '2026-2027 Güz' },
    { value: 'BAHAR', label: '2026-2027 Bahar' },
    { value: 'YAZ_OKULU', label: '2025-2026 Güz' },
  ];

  React.useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex h-10 w-44 items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:border-[#88d0f2] hover:bg-slate-50 focus:outline-none"
      >
        <span className="truncate">{selectedOption.label}</span>
        <svg
          className={cn("h-4 w-4 text-slate-400 transition-transform duration-200 shrink-0 ml-1.5", isOpen && "rotate-180")}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 z-50 w-44 origin-top-right rounded-xl border border-slate-200/60 bg-white p-1 shadow-lg animate-fade-in">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={cn(
                "flex w-full items-center px-3 py-2 text-xs font-semibold rounded-lg transition duration-150 text-left",
                option.value === value
                  ? "bg-[#eff8ff] text-[#006482]"
                  : "text-slate-650 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
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
      href: '/department-admin/dersler',
      emptyText: 'Henüz ders bulunmuyor.',
      colorClass: 'text-[#006482] bg-[#eff8ff] border-[#006482]/10',
    },
    {
      label: 'Akademisyen',
      value: data?.academicianCount ?? 0,
      icon: GraduationCap,
      href: '/department-admin/academisyenler',
      emptyText: 'Henüz akademisyen bulunmuyor.',
      colorClass: 'text-emerald-650 bg-emerald-50/80 border-emerald-100',
    },
    {
      label: 'Derslik',
      value: data?.classroomCount ?? 0,
      icon: MapPinned,
      href: '/classrooms',
      emptyText: 'Derslik bulunmuyor.',
      colorClass: 'text-amber-650 bg-amber-50/80 border-amber-100',
    },
    {
      label: 'Programlanan Ders',
      value: data?.scheduleSummary?.completedCourses ?? 0,
      icon: Calendar,
      href: '/department-admin/ders-programi',
      emptyText: 'Programlanan ders yok.',
      colorClass: 'text-indigo-650 bg-indigo-50/80 border-indigo-100',
    },
  ];

  if (error) {
    return (
      <div className="dts-card py-12 text-center">
        <h3 className="text-lg font-bold text-red-600">Bölüm bilgileri yüklenemedi.</h3>
        <p className="mt-2 text-sm text-slate-500">Lütfen daha sonra tekrar deneyiniz.</p>
      </div>
    );
  }

  const completionPercentage = data?.scheduleSummary?.completionPercentage ?? 0;
  const incompleteOrNotScheduled = data?.scheduleSummary?.courses.filter(
    (c) => c.status === 'INCOMPLETE' || c.status === 'NOT_SCHEDULED'
  ) || [];

  const recentChanges = [
    {
      id: '1',
      academician: 'Doç. Dr. Ahmet Yılmaz',
      action: 'Telafi dersi eklendi',
      course: 'CENG201 - Veri Yapıları',
      timestamp: '24.09.2026 14:30',
      icon: CalendarPlus,
      color: 'text-amber-600 bg-amber-50 border-amber-100',
    },
    {
      id: '2',
      academician: 'Doç. Dr. Ahmet Yılmaz',
      action: 'Ek ders eklendi',
      course: 'CENG101 - Bilgisayar Programlamaya Giriş',
      timestamp: '23.09.2026 16:40',
      icon: CalendarPlus,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    },
    {
      id: '3',
      academician: 'Doç. Dr. Ahmet Yılmaz',
      action: 'Ders iptal edildi',
      course: 'CENG301 - İşletim Sistemleri',
      timestamp: '22.09.2026 10:15',
      icon: Ban,
      color: 'text-rose-600 bg-rose-50 border-rose-100',
    },
    {
      id: '4',
      academician: 'Prof. Dr. Ayşe Kaya',
      action: 'Derslik değişikliği yapıldı',
      course: 'CENG401 - Algoritmalar',
      timestamp: '21.09.2026 11:00',
      icon: MapPin,
      color: 'text-blue-600 bg-blue-50 border-blue-100',
    },
  ];

  return (
    <div className="space-y-5 sm:space-y-6 max-w-full">
      {/* 1. Üst Header Kartı */}
      <section className="dts-card relative border-slate-200/80 bg-gradient-to-br from-[#f6fbfe] via-white to-[#e2f3fa] px-5 py-4 sm:py-4.5 shadow-xs">
        <div className="absolute inset-x-0 top-0 h-[3px] rounded-t-2xl bg-gradient-to-r from-[#006482] via-[#00a896] to-[#fabc07]" />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-1 flex-1">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Ana Ekran</p>
            {isLoading ? (
              <div className="space-y-2">
                <div className="h-6 w-64 max-w-full animate-pulse rounded bg-slate-100" />
                <div className="h-4 w-40 animate-pulse rounded bg-slate-100" />
              </div>
            ) : (
              <>
                <h2 className="break-words text-lg font-bold tracking-tight text-slate-900 leading-snug">
                  {data?.departmentName} Bölümü
                </h2>
                <p className="text-xs font-medium text-slate-500">{data?.facultyName}</p>
              </>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-2.5">
            <SemesterDropdown value={selectedSemester} onChange={setSelectedSemester} />
            <div className="inline-flex w-fit items-center rounded-full border border-indigo-155 bg-indigo-50 px-2.5 py-0.5 text-[10px] font-extrabold text-indigo-700">
              Bölüm Admini
            </div>
          </div>
        </div>
      </section>

      {/* 2. İstatistikler */}
      <section className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="relative group p-[1.5px] rounded-2xl transition-all duration-300 hover:-translate-y-0.5 cursor-pointer">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#006482] via-[#00a896] to-[#fabc07] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <Link
                to={stat.href}
                className="relative rounded-[14px] bg-gradient-to-br from-[#f6fbfe] via-white to-[#e2f3fa] p-5 border border-slate-200/80 group-hover:border-transparent transition-all duration-300 block text-left h-full"
              >
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
                  <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all duration-300", stat.colorClass)}>
                    <Icon className="h-5 w-5 animate-none group-hover:scale-105 transition-transform duration-300" />
                  </div>
                </div>
              </Link>
            </div>
          );
        })}
      </section>

      {/* 3. Alt Kolonlu 3'lü Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
        {/* SOL: Ders Programı Durumu */}
        <div className="relative group p-[1.5px] rounded-2xl transition-all duration-300 hover:-translate-y-0.5 cursor-pointer h-full min-h-[350px]">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#006482] via-[#00a896] to-[#fabc07] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <section className="relative rounded-[14px] bg-gradient-to-br from-[#f6fbfe] via-white to-[#e2f3fa] p-5 border border-slate-200/80 group-hover:border-transparent transition-all duration-300 h-full flex flex-col justify-between space-y-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Ders Programı Durumu</h3>
              {isLoading ? (
                 <div className="h-16 animate-pulse rounded-lg bg-slate-100" />
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#eff8ff] text-[#006482] font-black text-lg border border-[#006482]/10 shadow-3xs">
                      {completionPercentage}%
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">Planlama Oranı</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tamamlanma Oranı</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2.5 border-t border-slate-100 pt-4 text-[11px] text-slate-600 font-semibold">
                    <div className="flex justify-between items-center">
                      <span className="text-emerald-600">✓ Tamamlanan:</span>
                      <span className="text-slate-800 font-bold">{data?.scheduleSummary?.completedCourses ?? 0} ders</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-amber-600">⚠ Eksik Saat:</span>
                      <span className="text-slate-800 font-bold">{data?.scheduleSummary?.incompleteCourses ?? 0} ders</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">○ Planlanmamış:</span>
                      <span className="text-slate-800 font-bold">{data?.scheduleSummary?.notScheduledCourses ?? 0} ders</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="w-full bg-slate-100/90 rounded-full h-2 mt-4">
              <div 
                className="bg-[#006482] h-2 rounded-full transition-all duration-500" 
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </section>
        </div>

        {/* ORTA: Eksik / Programlanmamış Dersler */}
        <div className="relative group p-[1.5px] rounded-2xl transition-all duration-300 hover:-translate-y-0.5 cursor-pointer h-full min-h-[350px]">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#006482] via-[#00a896] to-[#fabc07] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <section className="relative rounded-[14px] bg-gradient-to-br from-[#f6fbfe] via-white to-[#e2f3fa] p-5 border border-slate-200/80 group-hover:border-transparent transition-all duration-300 h-full flex flex-col justify-between">
            <div className="w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Eksik Dersler</h3>
                <Link to="/department-admin/ders-programi" className="text-[10px] font-bold text-[#006482] hover:underline">Tümünü Gör</Link>
              </div>
              
              {isLoading ? (
                 <div className="space-y-2">
                   <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
                   <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
                 </div>
              ) : incompleteOrNotScheduled.length === 0 ? (
                 <p className="text-xs text-slate-500 py-4 text-center">Harika! Tüm dersler programlanmış.</p>
              ) : (
                <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                  {incompleteOrNotScheduled.slice(0, 4).map((course) => (
                    <div key={course.courseId} className="flex justify-between items-center p-2.5 rounded-xl border border-slate-100/90 bg-gradient-to-br from-white/95 to-[#eff9fe]/40 hover:border-[#00a896] hover:bg-[#eff8ff] transition-all duration-150">
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="text-xs font-bold text-slate-800 truncate">{course.courseCode} - {course.courseName}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{course.status === 'NOT_SCHEDULED' ? 'Hiç programlanmamış' : `${course.remainingHours} saat eksik`}</p>
                      </div>
                      <Link to="/department-admin/ders-programi" className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[9px] font-bold text-slate-700 hover:bg-slate-50 transition-colors shrink-0">
                        Git
                      </Link>
                    </div>
                  ))}
                  {incompleteOrNotScheduled.length > 4 && (
                    <p className="text-[10px] text-center text-slate-400 pt-1">+ {incompleteOrNotScheduled.length - 4} ders daha</p>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* SAĞ: Son Değişiklikler */}
        <div className="relative group p-[1.5px] rounded-2xl transition-all duration-300 hover:-translate-y-0.5 cursor-pointer h-full min-h-[350px]">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#006482] via-[#00a896] to-[#fabc07] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <section className="relative rounded-[14px] bg-gradient-to-br from-[#f6fbfe] via-white to-[#e2f3fa] p-5 border border-slate-200/80 group-hover:border-transparent transition-all duration-300 h-full flex flex-col justify-between">
            <div className="w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Son Değişiklikler</h3>
                <span className="text-[10px] font-bold text-[#006482] hover:underline cursor-pointer">Tümünü Gör</span>
              </div>

              <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                {recentChanges.map((change) => {
                  const Icon = change.icon;
                  return (
                    <div key={change.id} className="flex gap-2.5 p-2.5 rounded-xl border border-slate-100/90 bg-gradient-to-br from-white/95 to-[#eff9fe]/40 hover:border-[#00a896] hover:bg-[#eff8ff] transition-all duration-150">
                      <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border", change.color)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-start gap-1">
                          <p className="text-[11px] font-bold text-slate-800 truncate">{change.academician}</p>
                          <span className="text-[9px] text-slate-400 font-semibold shrink-0 whitespace-nowrap">{change.timestamp.split(' ')[0]}</span>
                        </div>
                        <p className="text-[10px] font-semibold text-[#006482] mt-0.2">{change.action}</p>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">{change.course}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </div>
      </div>

      {!isLoading && data?.academicianCount === 0 && data?.courseCount === 0 && (
        <EmptyState
          title="Bölüm verisi henüz boş"
          description="Bu bölüme ait akademisyen veya ders kaydı eklendiğinde özet burada görünecek."
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
      href: '/super-admin/fakulteler',
    },
    {
      label: 'Toplam Bina',
      value: stats?.totalBuildings ?? 0,
      icon: Building2,
      href: '/super-admin/fakulteler',
    },
    {
      label: 'Toplam Kat',
      value: stats?.totalFloors ?? 0,
      icon: Layers,
      href: '/super-admin/fakulteler',
    },
    {
      label: 'Toplam Bölüm',
      value: stats?.totalDepartments ?? 0,
      icon: GitBranch,
      href: '/super-admin/bolumler',
    },
    {
      label: 'Toplam Derslik',
      value: stats?.totalClassrooms ?? 0,
      icon: MapPinned,
      href: '/classrooms',
    },
    {
      label: 'Toplam Akademisyen',
      value: stats?.totalAcademicians ?? 0,
      icon: GraduationCap,
      href: '/super-admin/kullanicilar',
    },
    {
      label: 'Toplam Bölüm Admini',
      value: stats?.totalDepartmentAdmins ?? 0,
      icon: Shield,
      href: '/super-admin/kullanicilar',
    },
    {
      label: 'Toplam Kullanıcı',
      value: stats?.totalUsers ?? 0,
      icon: Users,
      href: '/super-admin/kullanicilar',
    },
  ];

  if (error) {
    return (
      <div className="dts-card py-10 text-center border-slate-200/80 bg-gradient-to-br from-[#f6fbfe] via-white to-[#e2f3fa]">
        <h3 className="text-base font-bold text-red-600">Veriler Yüklenirken Bir Hata Oluştu</h3>
        <p className="mt-1 text-xs text-slate-500">Lütfen daha sonra tekrar deneyiniz.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3.5 sm:space-y-4">
      {/* 1. Üst Ana Kart / Hero Alanı */}
      <section className="dts-card relative overflow-hidden border-[#006482]/15 bg-gradient-to-br from-[#edf7fd] via-[#f8fcff] to-white px-4 py-3 sm:px-5 sm:py-3.5 shadow-sm">
        <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#004b62] via-[#006482] to-[#fabc07]" />
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#eff8ff] text-[#006482] border border-[#006482]/15">
              <Shield className="h-4.5 w-4.5" />
            </div>
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-900">
              Süper Admin Paneli 👋
            </h2>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 shrink-0">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Sistem Aktif
          </span>
        </div>
      </section>

      {/* 2. Hızlı İşlemler & Görüntülemeler */}
      <div className="grid gap-3 lg:grid-cols-12">
        {/* Hızlı İşlemler */}
        <section className="space-y-1.5 lg:col-span-7">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Hızlı İşlemler</h3>
          <div className="grid gap-2 grid-cols-1 sm:grid-cols-3">
            <Link
              to="/super-admin/fakulteler"
              className="dts-card dts-interactive-card flex items-center justify-between p-3 group border-slate-200/80 bg-gradient-to-br from-[#f6fbfe] via-white to-[#e2f3fa]"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#eff8ff] text-[#006482] group-hover:bg-[#d8f2fb] group-hover:text-[#005a75] transition-colors duration-200">
                  <Landmark className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 text-left">
                  <p className="text-xs font-bold text-slate-800 truncate">Fakülte Ekle</p>
                  <p className="text-[10px] text-slate-400 truncate">Yeni fakülte tanımla</p>
                </div>
              </div>
              <Plus className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-[#006482] transition duration-200" />
            </Link>

            <Link
              to="/super-admin/dersler"
              className="dts-card dts-interactive-card flex items-center justify-between p-3 group border-slate-200/80 bg-gradient-to-br from-[#f6fbfe] via-white to-[#e2f3fa]"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#eff8ff] text-[#006482] group-hover:bg-[#d8f2fb] group-hover:text-[#005a75] transition-colors duration-200">
                  <BookOpen className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 text-left">
                  <p className="text-xs font-bold text-slate-800 truncate">Ders Ekle</p>
                  <p className="text-[10px] text-slate-400 truncate">Yeni ders tanımla</p>
                </div>
              </div>
              <Plus className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-[#006482] transition duration-200" />
            </Link>

            <Link
              to="/super-admin/kullanicilar"
              className="dts-card dts-interactive-card flex items-center justify-between p-3 group border-slate-200/80 bg-gradient-to-br from-[#f6fbfe] via-white to-[#e2f3fa]"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#eff8ff] text-[#006482] group-hover:bg-[#d8f2fb] group-hover:text-[#005a75] transition-colors duration-200">
                  <Users className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 text-left">
                  <p className="text-xs font-bold text-slate-800 truncate">Kullanıcı Ekle</p>
                  <p className="text-[10px] text-slate-400 truncate">Yeni kullanıcı kaydet</p>
                </div>
              </div>
              <Plus className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-[#006482] transition duration-200" />
            </Link>
          </div>
        </section>

        {/* Görüntülemeler */}
        <section className="space-y-1.5 lg:col-span-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Görüntülemeler</h3>
          <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
            <Link
              to="/classrooms"
              className="dts-card dts-interactive-card flex items-center justify-between p-3 group border-slate-200/80 bg-gradient-to-br from-[#f6fbfe] via-white to-[#e2f3fa]"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#eff8ff] text-[#006482] group-hover:bg-[#d8f2fb] group-hover:text-[#005a75] transition-colors duration-200">
                  <MapPinned className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 text-left">
                  <p className="text-xs font-bold text-slate-800 truncate">Derslik Görüntüleme</p>
                  <p className="text-[10px] text-slate-400 truncate">Derslik doluluk ve yerleşim</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-[#006482] group-hover:translate-x-0.5 transition duration-200" />
            </Link>

            <Link
              to="/programlar"
              className="dts-card dts-interactive-card flex items-center justify-between p-3 group border-slate-200/80 bg-gradient-to-br from-[#f6fbfe] via-white to-[#e2f3fa]"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#eff8ff] text-[#006482] group-hover:bg-[#d8f2fb] group-hover:text-[#005a75] transition-colors duration-200">
                  <Calendar className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 text-left">
                  <p className="text-xs font-bold text-slate-800 truncate">Programlar</p>
                  <p className="text-[10px] text-slate-400 truncate">Haftalık ders programı</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-[#006482] group-hover:translate-x-0.5 transition duration-200" />
            </Link>
          </div>
        </section>
      </div>

      {/* 3. İstatistik Kartları / Genel Bakış */}
      <section className="space-y-1.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Genel Bakış</h3>

        <div className="grid gap-2.5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;

            return (
              <Link
                key={stat.label}
                to={stat.href}
                className="dts-card dts-interactive-card group p-3 sm:p-3.5 border-slate-200/80 bg-gradient-to-br from-[#f6fbfe] via-white to-[#e2f3fa] block cursor-pointer"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold tracking-wide text-slate-500 truncate group-hover:text-[#006482] transition-colors">
                      {stat.label}
                    </p>
                    {isLoading ? (
                      <div className="mt-1.5 h-6 w-12 animate-pulse rounded-md bg-slate-100" />
                    ) : (
                      <p className="mt-1 text-xl font-bold tracking-tight text-slate-900">
                        {stat.value}
                      </p>
                    )}
                  </div>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#eff8ff] text-[#006482] group-hover:bg-[#d8f2fb] group-hover:text-[#005a75] transition-colors duration-200">
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 4. Son Eklenen Kayıtlar */}
      <section className="space-y-1.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Son Eklenen Kayıtlar</h3>
        
        <div className="grid gap-3 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {/* Son Eklenen Fakülteler */}
          <div className="dts-card p-3.5 sm:p-4 space-y-2.5 border-slate-200/80 bg-gradient-to-br from-[#f6fbfe] via-white to-[#e2f3fa]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="text-xs font-bold uppercase tracking-wide text-slate-700 flex items-center gap-1.5">
                <Landmark className="h-3.5 w-3.5 text-[#006482]" />
                Son Eklenen Fakülteler
              </h4>
              <Link to="/super-admin/fakulteler" className="text-[11px] font-semibold text-[#006482] hover:underline flex items-center gap-0.5">
                Tümü <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            
            {isLoading ? (
              <div className="space-y-1.5">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-8 w-full animate-pulse rounded-lg bg-slate-50" />
                ))}
              </div>
            ) : !data?.recentFaculties?.length ? (
              <p className="text-xs text-slate-400 py-2.5 text-center">Fakülte kaydı bulunmuyor.</p>
            ) : (
              <div className="divide-y divide-slate-100/80">
                {data.recentFaculties.map((faculty) => (
                  <Link
                    key={faculty.id}
                    to={`/super-admin/fakulteler/${faculty.id}`}
                    className="py-1.5 px-2 -mx-1 rounded-lg flex justify-between items-center gap-2 hover:bg-white/80 transition-colors group"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-800 truncate group-hover:text-[#006482] transition-colors">{faculty.name}</p>
                      <p className="text-[10px] text-slate-400">Kod: {faculty.code}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1 shrink-0">
                      <Calendar className="h-3 w-3" />
                      {formatDate(faculty.createdAt)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Son Eklenen Binalar */}
          <div className="dts-card p-3.5 sm:p-4 space-y-2.5 border-slate-200/80 bg-gradient-to-br from-[#f6fbfe] via-white to-[#e2f3fa]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="text-xs font-bold uppercase tracking-wide text-slate-700 flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-[#006482]" />
                Son Eklenen Binalar
              </h4>
              <Link to="/super-admin/fakulteler" className="text-[11px] font-semibold text-[#006482] hover:underline flex items-center gap-0.5">
                Tümü <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            
            {isLoading ? (
              <div className="space-y-1.5">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-8 w-full animate-pulse rounded-lg bg-slate-50" />
                ))}
              </div>
            ) : !data?.recentBuildings?.length ? (
              <p className="text-xs text-slate-400 py-2.5 text-center">Bina kaydı bulunmuyor.</p>
            ) : (
              <div className="divide-y divide-slate-100/80">
                {data.recentBuildings.map((building) => (
                  <Link
                    key={building.id}
                    to={`/super-admin/binalar/${building.id}`}
                    className="py-1.5 px-2 -mx-1 rounded-lg flex justify-between items-center gap-2 hover:bg-white/80 transition-colors group"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-800 truncate group-hover:text-[#006482] transition-colors">{building.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{building.facultyName}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1 shrink-0">
                      <Calendar className="h-3 w-3" />
                      {formatDate(building.createdAt)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Son Eklenen Kullanıcılar */}
          <div className="dts-card p-3.5 sm:p-4 space-y-2.5 border-slate-200/80 bg-gradient-to-br from-[#f6fbfe] via-white to-[#e2f3fa]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="text-xs font-bold uppercase tracking-wide text-slate-700 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-[#006482]" />
                Son Eklenen Kullanıcılar
              </h4>
              <Link to="/super-admin/kullanicilar" className="text-[11px] font-semibold text-[#006482] hover:underline flex items-center gap-0.5">
                Tümü <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            
            {isLoading ? (
              <div className="space-y-1.5">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-8 w-full animate-pulse rounded-lg bg-slate-50" />
                ))}
              </div>
            ) : !data?.recentUsers?.length ? (
              <p className="text-xs text-slate-400 py-2.5 text-center">Kullanıcı kaydı bulunmuyor.</p>
            ) : (
              <div className="divide-y divide-slate-100/80">
                {data.recentUsers.map((user) => (
                  <Link
                    key={user.id}
                    to="/super-admin/kullanicilar"
                    className="py-1.5 px-2 -mx-1 rounded-lg flex justify-between items-center gap-2 hover:bg-white/80 transition-colors group"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-800 truncate group-hover:text-[#006482] transition-colors">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                    </div>
                    <div className="flex flex-col items-end gap-0.5 shrink-0">
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold border ${roleBadgeClasses[user.role]}`}>
                        {roleLabels[user.role]}
                      </span>
                      <span className="text-[9px] text-slate-400 font-medium flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(user.createdAt)}
                      </span>
                    </div>
                  </Link>
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
