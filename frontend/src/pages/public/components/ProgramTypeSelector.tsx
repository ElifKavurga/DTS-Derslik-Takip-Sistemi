import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { Presentation, School, UserRound } from 'lucide-react';
import { cn } from '@/utils/cn';
import { getCurrentWeekStart } from '@/utils/date';

export const ProgramTypeSelector = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const currentWeek = searchParams.get('week') || getCurrentWeekStart();

  const tabs = [
    {
      id: 'classroom',
      name: 'Derslik Programı',
      path: '/programlar/sinif',
      icon: Presentation,
    },
    {
      id: 'department',
      name: 'Bölüm Programı',
      path: '/programlar/bolum',
      icon: School,
    },
    {
      id: 'academician',
      name: 'Öğretim Görevlisi Programı',
      path: '/programlar/akademisyen',
      icon: UserRound,
    },
  ];

  return (
    <div className="mb-4 grid gap-1.5 rounded-[24px] border border-slate-200/80 bg-gradient-to-br from-[#f6fbfe] via-white to-[#e2f3fa] p-1.5 shadow-xs sm:grid-cols-3">
      {tabs.map((tab) => {
        const isActive = location.pathname.startsWith(tab.path);
        const targetUrl = `${tab.path}?week=${currentWeek}`;

        if (isActive) {
          return (
            <Link
              key={tab.id}
              to={targetUrl}
              className="flex min-h-10 items-center justify-center gap-2 rounded-2xl px-3 py-2 text-center text-xs font-semibold transition-all duration-300 sm:text-sm bg-[#006482] text-white shadow-[0_4px_12px_rgba(0,100,130,0.16)]"
            >
              <tab.icon className="h-4 w-4 text-white" />
              {tab.name}
            </Link>
          );
        }

        return (
          <div
            key={tab.id}
            className="group relative p-[1.5px] rounded-2xl transition-all duration-300 hover:shadow-xs"
          >
            {/* Gradient border on hover */}
            <div
              aria-hidden="true"
              className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#006482] via-[#00a896] to-[#fabc07] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            />
            <Link
              to={targetUrl}
              className="relative flex min-h-10 w-full items-center justify-center gap-2 rounded-[14px] border border-transparent bg-transparent px-3 py-2 text-center text-xs font-bold text-slate-600 transition-all duration-300 sm:text-sm group-hover:bg-[#f6fbfe] group-hover:text-[#006482]"
            >
              <tab.icon className={cn('h-4 w-4 text-slate-500 transition-colors duration-300 group-hover:text-[#006482]')} />
              {tab.name}
            </Link>
          </div>
        );
      })}
    </div>
  );
};
