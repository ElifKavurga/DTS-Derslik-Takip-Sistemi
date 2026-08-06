import { ChevronRight, Home } from 'lucide-react';

type BreadcrumbProps = {
  items: string[];
};

export const Breadcrumb = ({ items }: BreadcrumbProps) => {
  return (
    <nav className="flex items-center gap-1 text-xs font-medium text-slate-500" aria-label="Breadcrumb">
      <Home className="h-3.5 w-3.5" />
      {items.map((item) => (
        <span key={item} className="flex items-center gap-1">
          <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
          <span>{item}</span>
        </span>
      ))}
    </nav>
  );
};
