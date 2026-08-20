import { LogIn, Presentation } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';

export const PublicProgramHeader = ({
  title,
  description,
  showBackLink = false,
}: {
  title: string;
  description: string;
  showBackLink?: boolean;
}) => (
  <PageHeader
    title={title}
    description={description}
    backAction={showBackLink ? (
      <Link to="/programlar/sinif" className="text-xs font-semibold text-slate-500 transition-colors hover:text-[#006482]">
        &larr; Programlar
      </Link>
    ) : undefined}
    action={(
      <div className="flex flex-wrap items-center gap-2">
        <Link to="/classrooms" className="dts-btn-secondary">
          <Presentation className="h-4 w-4" />
          Derslik Görüntüleme
        </Link>
        <Link to="/giris" className="dts-btn-secondary">
          <LogIn className="h-4 w-4" />
          Giriş Yap
        </Link>
      </div>
    )}
  />
);