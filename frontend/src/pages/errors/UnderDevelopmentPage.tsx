import { useNavigate } from 'react-router-dom';
import { Wrench, ArrowLeft } from 'lucide-react';
import { PageTitle } from '@/components/layout/PageTitle';

interface UnderDevelopmentPageProps {
  title: string;
}

export const UnderDevelopmentPage = ({ title }: UnderDevelopmentPageProps) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <PageTitle
        title={title}
        description="DTS Derslik Takip Sistemi Modülü"
      />

      <section className="dts-card flex flex-col items-center justify-center py-16 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#004b62] via-[#006482] to-[#fabc07]" />
        
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#eff8ff] text-[#006482] mb-6 animate-bounce">
          <Wrench className="h-8 w-8" />
        </div>

        <h2 className="text-xl font-bold text-slate-900 mb-2">Bu Modül Geliştirilmektedir</h2>
        
        <p className="text-sm text-slate-500 max-w-md mb-8 leading-relaxed">
          {title} modülü şu anda yapım aşamasındadır. Geliştirme süreci tamamlandıktan sonra bu ekrandan ilgili işlemleri gerçekleştirebilirsiniz.
        </p>

        <button
          onClick={() => navigate(-1)}
          className="dts-btn-primary gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Geri Dön
        </button>
      </section>
    </div>
  );
};
