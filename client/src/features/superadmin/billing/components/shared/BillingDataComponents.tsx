import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/marketing_ui/table';
import { Checkbox } from '@/components/marketing_ui/checkbox';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/marketing_ui/pagination';
import { Button } from '@/components/marketing_ui/button';
import { Input } from '@/components/marketing_ui/input';
import { InputGroup } from '@/components/marketing_ui/input-group';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerFooter, DrawerClose } from '@/components/marketing_ui/drawer';
import { Label } from '@/components/marketing_ui/label';
import { Chip } from '@/components/marketing_ui/chip';
import { Badge } from '@/components/marketing_ui/badge';
import { Search, Filter, X } from 'lucide-react';

// 1. BillingDataTable
export const BillingDataTable: React.FC<{
  columns: string[];
  data: any[];
  onSelect?: (id: string) => void;
  selectedIds?: string[];
}> = ({ columns, data, onSelect, selectedIds = [] }) => {
  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            {onSelect && (
              <TableHead className="w-[50px]">
                <Checkbox aria-label="Select all" />
              </TableHead>
            )}
            {columns.map((col, idx) => (
              <TableHead key={idx}>{col}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length + (onSelect ? 1 : 0)} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          ) : (
            data.map((row, idx) => (
              <TableRow key={idx}>
                {onSelect && (
                  <TableCell>
                    <Checkbox 
                      checked={selectedIds.includes(row.id)} 
                      onCheckedChange={() => onSelect(row.id)} 
                    />
                  </TableCell>
                )}
                {columns.map((col, cIdx) => (
                  <TableCell key={cIdx}>{row[col.toLowerCase()] || '-'}</TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

// 2. BillingPagination
export const BillingPagination: React.FC<{ currentPage: number; totalPages: number; onPageChange: (page: number) => void }> = ({ currentPage, totalPages, onPageChange }) => {
  return (
    <Pagination className="mt-4 justify-end">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious 
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            className={currentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} 
          />
        </PaginationItem>
        {[...Array(totalPages)].map((_, i) => (
          <PaginationItem key={i}>
            <PaginationLink 
              isActive={currentPage === i + 1}
              onClick={() => onPageChange(i + 1)}
              className="cursor-pointer"
            >
              {i + 1}
            </PaginationLink>
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext 
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            className={currentPage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};

// 3. BillingSearchInput
export const BillingSearchInput: React.FC<{ placeholder?: string; onSearch: (val: string) => void }> = ({ placeholder = "Search...", onSearch }) => {
  return (
    <InputGroup className="w-full sm:w-[300px]">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-4 w-4 text-muted-foreground" />
      </div>
      <Input 
        placeholder={placeholder} 
        onChange={(e) => onSearch(e.target.value)} 
        className="pl-9"
      />
    </InputGroup>
  );
};

// 4. BillingFilterDrawer
export const BillingFilterDrawer: React.FC<{ children: React.ReactNode; onApply: () => void; activeFilterCount?: number }> = ({ children, onApply, activeFilterCount = 0 }) => {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline" className="relative">
          <Filter className="mr-2 h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-2 px-1.5 py-0.5 min-w-[20px] h-5">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-w-md ml-auto right-0 left-auto h-full rounded-l-xl rounded-r-none">
        <DrawerHeader>
          <DrawerTitle>Advanced Filters</DrawerTitle>
        </DrawerHeader>
        <div className="p-4 flex-1 overflow-y-auto">
          {children}
        </div>
        <DrawerFooter className="flex-row justify-end space-x-2 border-t">
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
          <DrawerClose asChild>
            <Button onClick={onApply}>Apply Filters</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

// 5. ActiveFilterChips
export const ActiveFilterChips: React.FC<{ filters: { id: string; label: string }[]; onRemove: (id: string) => void }> = ({ filters, onRemove }) => {
  if (filters.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 items-center">
      <span className="text-sm text-muted-foreground">Active filters:</span>
      {filters.map(filter => (
        <Chip key={filter.id} variant="secondary" className="flex items-center gap-1">
          {filter.label}
          <button onClick={() => onRemove(filter.id)} className="hover:bg-muted-foreground/20 rounded-full p-0.5">
            <X className="h-3 w-3" />
          </button>
        </Chip>
      ))}
      <Button variant="ghost" size="sm" onClick={() => filters.forEach(f => onRemove(f.id))} className="h-6 px-2 text-xs">
        Clear All
      </Button>
    </div>
  );
};
