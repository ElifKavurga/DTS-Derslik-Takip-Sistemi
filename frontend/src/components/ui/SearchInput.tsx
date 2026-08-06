import { InputHTMLAttributes } from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/utils/cn';

interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  onSearchChange: (value: string) => void;
}

export const SearchInput = ({
  onSearchChange,
  className,
  placeholder = 'Ara...',
  ...props
}: SearchInputProps) => {
  return (
    <div className={cn('relative w-full max-w-sm', className)}>
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
        <Search className="h-4.5 w-4.5" />
      </div>
      <input
        type="text"
        placeholder={placeholder}
        onChange={(e) => onSearchChange(e.target.value)}
        className="dts-input pl-11"
        {...props}
      />
    </div>
  );
};
