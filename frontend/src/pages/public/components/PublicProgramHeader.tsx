import { LogIn, Presentation } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';

export const PublicProgramHeader = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => (
  <PageHeader
    title={title}
    description={description}
    action={(
      <div className="flex flex-wrap items-center gap-2">
        {/* Derslik Görüntüleme butonu — group/gradient-overlay hover */}
        <div className="group relative p-[1.5px] rounded-xl transition-all duration-300 shadow-xs hover:shadow-md">
          <div
            aria-hidden="true"
            className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#006482] via-[#00a896] to-[#fabc07] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          />
          <Link
            to="/classrooms"
            className="relative inline-flex h-9 items-center justify-center gap-1.5 rounded-[10px] border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition-all duration-300 group-hover:border-transparent group-hover:bg-[#f6fbfe] group-hover:text-[#006482]"
          >
            <Presentation className="h-4 w-4" />
            Derslik Görüntüleme
          </Link>
        </div>

        {/* Giriş Yap butonu — group/gradient-overlay hover */}
        <div className="group relative p-[1.5px] rounded-xl transition-all duration-300 shadow-xs hover:shadow-md">
          <div
            aria-hidden="true"
            className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#006482] via-[#00a896] to-[#fabc07] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          />
          <Link
            to="/giris"
            className="relative inline-flex h-9 items-center justify-center gap-1.5 rounded-[10px] border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition-all duration-300 group-hover:border-transparent group-hover:bg-[#f6fbfe] group-hover:text-[#006482]"
          >
            <LogIn className="h-4 w-4" />
            Giriş Yap
          </Link>
        </div>
      </div>
    )}
  />
);
