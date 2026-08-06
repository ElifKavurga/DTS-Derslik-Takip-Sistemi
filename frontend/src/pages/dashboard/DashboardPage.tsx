import { Building2, GraduationCap, Landmark, MapPinned } from 'lucide-react';
import { PageTitle } from '@/components/layout/PageTitle';

const stats = [
  {
    label: 'Fakülte',
    value: '—',
    description: 'Veri oluşturulduğunda görüntülenecek',
    icon: Landmark,
  },
  {
    label: 'Bina',
    value: '—',
    description: 'Veri oluşturulduğunda görüntülenecek',
    icon: Building2,
  },
  {
    label: 'Derslik',
    value: '—',
    description: 'Veri oluşturulduğunda görüntülenecek',
    icon: MapPinned,
  },
  {
    label: 'Akademisyen',
    value: '—',
    description: 'Veri oluşturulduğunda görüntülenecek',
    icon: GraduationCap,
  },
];

export const DashboardPage = () => {
  return (
    <div className="space-y-5">
      <section className="dts-card relative overflow-hidden py-4 px-5">
        <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#004b62] via-[#006482] to-[#fabc07]" />
        <div className="flex flex-col gap-1.5">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Hoş Geldiniz 👋</h2>
          <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
            Derslik Takip Sistemine hoş geldiniz. Sol taraftaki menüyü kullanarak işlemlerinizi gerçekleştirebilirsiniz.
          </p>
        </div>
      </section>

      <section className="space-y-3.5">
        <PageTitle
          title="Genel Bakış"
          description="Sistemde bulunan derslik ve akademik birimlerin genel durum metrikleri."
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <article
                key={stat.label}
                className="dts-card dts-card-hover group p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{stat.label}</p>
                    {stat.value === '—' ? (
                      <div className="mt-3.5 h-8 w-16 animate-pulse rounded-lg bg-slate-100" />
                    ) : (
                      <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                        {stat.value}
                      </p>
                    )}
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-slate-400 transition-colors duration-200 group-hover:bg-[#006482] group-hover:text-white">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                </div>
                <p className="mt-4 text-[11px] font-medium text-slate-400">{stat.description}</p>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
};
