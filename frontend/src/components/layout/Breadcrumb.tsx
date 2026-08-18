import { ChevronRight, Home } from 'lucide-react';

type BreadcrumbProps = {
  items: string[];
};

export const Breadcrumb = ({ items }: BreadcrumbProps) => {
  return (
    <nav className="flex flex-wrap items-center gap-1 text-[11px] sm:text-xs font-medium text-slate-500 min-w-0" aria-label="Breadcrumb">
      <Home className="h-3.5 w-3.5 shrink-0 text-slate-400" />
      {items.map((item, index) => (
        <span key={index} className="flex items-center gap-1 min-w-0">
          <ChevronRight className="h-3.5 w-3.5 text-slate-300 shrink-0" />
          <span className="truncate max-w-[80px] sm:max-w-[180px] md:max-w-none">{item}</span>
        </span>
      ))}
    </nav>
  );
};
