import { ReactNode } from 'react';
import { PageTitle } from '../layout/PageTitle';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export const PageHeader = ({ title, description, action }: PageHeaderProps) => {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-2">
      <PageTitle title={title} description={description} />
      {action && <div className="shrink-0 flex items-center">{action}</div>}
    </div>
  );
};
