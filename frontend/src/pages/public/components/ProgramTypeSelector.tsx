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
    <div className="flex flex-col sm:flex-row gap-2 rounded-2xl bg-white p-1.5 shadow-sm border border-[#006482]/10 mb-6">
      {tabs.map((tab) => {
        const isActive = location.pathname.startsWith(tab.path);
        const targetUrl = `${tab.path}?week=${currentWeek}`;
        
        return (
          <Link
            key={tab.id}
            to={targetUrl}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200',
              isActive
                ? 'bg-[#006482] text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
            )}
          >
            <tab.icon className={cn('h-4 w-4', isActive ? 'text-white' : 'text-slate-500')} />
            {tab.name}
          </Link>
        );
      })}
    </div>
  );
};
