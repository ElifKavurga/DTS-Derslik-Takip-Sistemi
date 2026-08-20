import { Link } from 'react-router-dom';
import { ArrowRight, Presentation, School, UserRound } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { PublicProgramHeader } from './components/PublicProgramHeader';

const programCards = [
  {
    title: 'Derslik Programı',
    description: 'Dersliklerin haftalık ders programlarını ve doluluk durumlarını görüntüleyin.',
    path: '/programlar/sinif',
    icon: Presentation,
  },
  {
    title: 'Bölüm Programı',
    description: 'Bölümlere ait müfredat ve haftalık genel ders programları.',
    path: '/programlar/bolum',
    icon: School,
  },
  {
    title: 'Öğretim Görevlisi Programı',
    description: 'Öğretim görevlilerinin haftalık ders programları ve müsaitlikleri.',
    path: '/programlar/akademisyen',
    icon: UserRound,
  },
];

export const ProgramsPage = () => {
  return (
    <main className="min-h-screen bg-slate-50/50 pb-12 pt-8">
      <PageContainer>
        <div className="space-y-6">
          <PublicProgramHeader title="Programlar" description="Derslik, bölüm veya öğretim görevlisi programlarını inceleyin." />

          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {programCards.map(({ title, description, path, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className="group rounded-2xl bg-slate-200/80 p-px shadow-sm transition-all duration-250 hover:-translate-y-0.5 hover:bg-gradient-to-r hover:from-[#006482] hover:to-[#fabc07] hover:shadow-lg"
              >
                <div className="flex min-h-[238px] h-full flex-col justify-between rounded-[15px] bg-gradient-to-br from-white via-white to-[#eff8ff] p-5 transition-colors duration-250 group-hover:from-[#f8fdff] group-hover:to-[#e3f8fb]">
                  <div>
                    <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#e8f7fb] text-[#006482] transition-colors duration-250 group-hover:bg-white group-hover:text-[#004b62]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h2 className="text-lg font-bold text-slate-900">{title}</h2>
                    <p className="mt-2 text-sm leading-5 text-slate-500">{description}</p>
                  </div>
                  <div className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-[#006482] transition-colors duration-250 group-hover:text-[#004b62]">
                    Programı Gör
                    <ArrowRight className="h-4 w-4 transition-transform duration-250 group-hover:translate-x-0.5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </PageContainer>
    </main>
  );
};
