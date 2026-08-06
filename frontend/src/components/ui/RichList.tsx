import { ReactNode } from 'react';

interface RichListProps {
  children: ReactNode;
}

export const RichList = ({ children }: RichListProps) => {
  return <div className="space-y-3.5">{children}</div>;
};
