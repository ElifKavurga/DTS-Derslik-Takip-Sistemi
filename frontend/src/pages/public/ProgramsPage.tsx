import { Link } from 'react-router-dom';
import { CalendarDays, LogIn, Presentation, School, UserRound } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { cn } from '@/utils/cn';

export const ProgramsPage = () => {
  return (
    <main className="min-h-screen bg-slate-50/50 pb-12 pt-8">
      <PageContainer>
        <div className="space-y-6">
          <header className="relative overflow-hidden rounded-3xl border border-[#006482]/15 bg-gradient-to-br from-[#eff8ff] via-white to-white px-5 py-4 shadow-md sm:px-6">
            <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#004b62] via-[#006482] to-[#fabc07]" />
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Programlar</h1>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                  Sınıf, bölüm veya öğretim görevlisi programlarını inceleyin.
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Link to="/classrooms" className="dts-btn-secondary">
                  <Presentation className="h-4 w-4" />
                  Derslik Görüntüleme
                </Link>
                <Link to="/giris" className="dts-btn-secondary">
                  <LogIn className="h-4 w-4" />
                  Giriş Yap
                </Link>
              </div>
            </div>
          </header>

          <div className="grid gap-6 md:grid-cols-3">
            <Link
              to="/programlar/sinif"
              className={cn(
                'group relative flex flex-col justify-between overflow-hidden rounded-3xl border p-6 shadow-sm transition-all hover:shadow-md',
                'border-[#006482]/20 bg-white hover:border-[#006482]/40',
              )}
            >
              <div className="mb-8">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eff8ff] text-[#006482]">
                  <Presentation className="h-6 w-6" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Sınıf Programı</h2>
                <p className="mt-2 text-sm text-slate-500">
                  Sınıfların haftalık ders programlarını ve doluluk durumlarını görüntüleyin.
                </p>
              </div>
              <div className="flex items-center text-sm font-semibold text-[#006482] group-hover:text-[#004b62]">
                Programı Gör &rarr;
              </div>
            </Link>

            <Link
              to="/programlar/bolum"
              className={cn(
                'group relative flex flex-col justify-between overflow-hidden rounded-3xl border p-6 shadow-sm transition-all hover:shadow-md',
                'border-[#006482]/20 bg-white hover:border-[#006482]/40',
              )}
            >
              <div className="mb-8">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eff8ff] text-[#006482]">
                  <School className="h-6 w-6" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Bölüm Programı</h2>
                <p className="mt-2 text-sm text-slate-500">
                  Bölümlere ait müfredat ve haftalık genel ders programları.
                </p>
              </div>
              <div className="flex items-center text-sm font-semibold text-[#006482] group-hover:text-[#004b62]">
                Programı Gör &rarr;
              </div>
            </Link>

            <Link
              to="/programlar/akademisyen"
              className={cn(
                'group relative flex flex-col justify-between overflow-hidden rounded-3xl border p-6 shadow-sm transition-all hover:shadow-md',
                'border-[#006482]/20 bg-white hover:border-[#006482]/40',
              )}
            >
              <div className="mb-8">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eff8ff] text-[#006482]">
                  <UserRound className="h-6 w-6" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Öğretim Görevlisi Programı</h2>
                <p className="mt-2 text-sm text-slate-500">
                  Öğretim görevlilerinin haftalık ders programları ve müsaitlikleri.
                </p>
              </div>
              <div className="flex items-center text-sm font-semibold text-[#006482] group-hover:text-[#004b62]">
                Programı Gör &rarr;
              </div>
            </Link>
          </div>
        </div>
      </PageContainer>
    </main>
  );
};
