import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/marketing_ui/table';
import { AsyncBillingState, BillingEmptyState } from './BillingStateComponents';
import { BillingPagination } from './BillingFilterComponents';
import { SearchX } from 'lucide-react';

// 42. BillingDataTable
export interface BillingColumn<T> {
  id: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export interface BillingDataTableProps<T> {
  data: T[] | undefined;
  columns: BillingColumn<T>[];
  isLoading: boolean;
  error?: Error | null;
  keyExtractor: (row: T) => string;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function BillingDataTable<T>({
  data,
  columns,
  isLoading,
  error,
  keyExtractor,
  currentPage,
  totalPages,
  onPageChange,
  emptyTitle = "No data found",
  emptyDescription = "There are no records matching your current filters."
}: BillingDataTableProps<T>) {
  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-card">
        <AsyncBillingState loading={isLoading} error={error} skeletonType="table">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead 
                    key={col.id} 
                    className={col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''}
                  >
                    {col.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data && data.length > 0 ? (
                data.map((row) => (
                  <TableRow key={keyExtractor(row)}>
                    {columns.map((col) => (
                      <TableCell 
                        key={col.id}
                        className={`${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''} ${col.className || ''}`}
                      >
                        {col.cell(row)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-48">
                    <BillingEmptyState 
                      icon={<SearchX />}
                      title={emptyTitle}
                      description={emptyDescription}
                    />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </AsyncBillingState>
      </div>

      {totalPages && totalPages > 1 && currentPage && onPageChange && (
        <BillingPagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}
