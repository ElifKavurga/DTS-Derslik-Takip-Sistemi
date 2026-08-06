import { ReactNode } from 'react';

export interface Column<T> {
  header: string;
  accessor: (item: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  emptyState: ReactNode;
  mobileCardRender: (item: T) => ReactNode;
}

export function DataTable<T>({
  data,
  columns,
  isLoading,
  emptyState,
  mobileCardRender,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="dts-table-container">
        <table className="dts-table">
          <thead>
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className="dts-th">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3].map((rowIdx) => (
              <tr key={rowIdx}>
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className="dts-td">
                    <div className="h-4.5 w-3/4 animate-pulse rounded bg-slate-100" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (data.length === 0) {
    return <>{emptyState}</>;
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block dts-table-container">
        <table className="dts-table">
          <thead>
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={col.className ? `${col.className} dts-th` : 'dts-th'}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, idx) => (
              <tr key={idx} className="dts-tr-hover">
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className="dts-td">
                    {col.accessor(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View */}
      <div className="md:hidden space-y-3.5">
        {data.map((item, idx) => (
          <div key={idx} className="dts-card p-5 relative overflow-hidden">
            <div className="absolute inset-y-0 left-0 w-[4px] bg-[#006482]" />
            <div className="pl-1">{mobileCardRender(item)}</div>
          </div>
        ))}
      </div>
    </>
  );
}
