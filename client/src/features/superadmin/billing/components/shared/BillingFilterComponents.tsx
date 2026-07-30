import React, { useState } from 'react';
import { Button } from '@/components/marketing_ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/marketing_ui/popover';
import { NikhilCalendar } from '@/components/marketing_ui/nikhil_calendar';
import { Combobox } from '@/components/marketing_ui/combobox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/marketing_ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem } from '@/components/marketing_ui/dropdown-menu';
import { CalendarIcon, ChevronDown, Save, Download, FileText, FileSpreadsheet, FilterX, Search, X, SlidersHorizontal, Settings2, Trash2, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useBillingOrganizations } from '../../hooks/useBillingFilters';
import { Tabs, TabsList, TabsTrigger } from '@/components/marketing_ui/tabs';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/marketing_ui/pagination';
import { Badge } from '@/components/marketing_ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose } from '@/components/marketing_ui/sheet';

// 1. DateRangePicker (using nikhil_calendar)
export const DateRangePicker: React.FC<{
  date?: { from: Date; to?: Date };
  setDate: (date: { from: Date; to?: Date } | undefined) => void;
}> = ({ date, setDate }) => {
  return (
    <div className="grid gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[300px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <NikhilCalendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={setDate as any}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

// 2. OrganizationSelector
export const OrganizationSelector: React.FC<{
  selectedId?: string;
  onSelect: (id: string) => void;
}> = ({ selectedId, onSelect }) => {
  const { data: orgs, isLoading } = useBillingOrganizations();
  const options = orgs?.map((org: any) => ({ label: org.name, value: org._id || org.id })) || [];

  return (
    <div className="relative">
      <Combobox
        options={options}
        value={selectedId || ''}
        onSelect={onSelect}
        placeholder={isLoading ? "Loading organizations..." : "Search organization..."}
        emptyText="No organization found."
      />
    </div>
  );
};

// 3. OrganizationTypeFilter
export const OrganizationTypeFilter: React.FC<{
  value?: string;
  onChange: (value: string) => void;
}> = ({ value, onChange }) => {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Org Type" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ALL">All Types</SelectItem>
        <SelectItem value="school">School</SelectItem>
        <SelectItem value="junior_college">Junior College</SelectItem>
        <SelectItem value="engineering">Engineering College</SelectItem>
        <SelectItem value="coaching">Coaching</SelectItem>
      </SelectContent>
    </Select>
  );
};

// 4. StructureTypeFilter
export const StructureTypeFilter: React.FC<{
  value?: string;
  onChange: (value: string) => void;
}> = ({ value, onChange }) => {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Structure Type" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ALL">All Structures</SelectItem>
        <SelectItem value="k12_standard">K-12 Standard</SelectItem>
        <SelectItem value="higher_ed_semester">Higher Ed (Semester)</SelectItem>
        <SelectItem value="coaching_batches">Coaching Batches</SelectItem>
      </SelectContent>
    </Select>
  );
};

// 5. SavedViewSelector
export const SavedViewSelector: React.FC<{
  views: { id: string; name: string }[];
  currentViewId?: string;
  onSelect: (id: string) => void;
  onSaveCurrent: () => void;
}> = ({ views, currentViewId, onSelect, onSaveCurrent }) => {
  const currentView = views.find(v => v.id === currentViewId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-[200px] justify-between">
          {currentView ? currentView.name : "Default View"}
          <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        {views.map(view => (
          <DropdownMenuItem key={view.id} onClick={() => onSelect(view.id)}>
            {view.name}
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem onClick={onSaveCurrent} className="border-t mt-1 pt-1 font-medium text-primary">
          <Save className="mr-2 h-4 w-4" /> Save Current View
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// 34. BillingNavigation
export const BillingNavigation: React.FC<{
  activeTab: string;
  onTabChange: (tab: string) => void;
}> = ({ activeTab, onTabChange }) => {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full border-b pb-0 mb-6 rounded-none">
      <TabsList className="bg-transparent h-12 p-0 space-x-6 justify-start w-full overflow-x-auto">
        {['catalog', 'subscriptions', 'revenue', 'transactions', 'failures'].map((tab) => (
          <TabsTrigger 
            key={tab} 
            value={tab} 
            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full capitalize text-muted-foreground data-[state=active]:text-foreground"
          >
            {tab}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
};

// 35. BillingPagination
export const BillingPagination: React.FC<{
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}> = ({ currentPage, totalPages, onPageChange }) => {
  return (
    <Pagination className="mt-4 justify-end">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious 
            href="#" 
            onClick={(e) => { e.preventDefault(); if(currentPage > 1) onPageChange(currentPage - 1); }} 
            className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
          />
        </PaginationItem>
        {[...Array(totalPages)].map((_, i) => (
          <PaginationItem key={i + 1}>
            <PaginationLink 
              href="#" 
              isActive={currentPage === i + 1}
              onClick={(e) => { e.preventDefault(); onPageChange(i + 1); }}
            >
              {i + 1}
            </PaginationLink>
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext 
            href="#" 
            onClick={(e) => { e.preventDefault(); if(currentPage < totalPages) onPageChange(currentPage + 1); }}
            className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};

// 36. ActiveFilterChips
export const ActiveFilterChips: React.FC<{
  filters: { id: string; label: string; value: string }[];
  onRemove: (id: string) => void;
  onClearAll: () => void;
}> = ({ filters, onRemove, onClearAll }) => {
  if (filters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 py-2">
      <span className="text-sm text-muted-foreground mr-2 flex items-center gap-1">
        <Search className="w-3 h-3" /> Active Filters:
      </span>
      {filters.map(filter => (
        <Badge key={filter.id} variant="secondary" className="flex items-center gap-1 font-normal bg-muted">
          <span className="text-muted-foreground">{filter.label}:</span> 
          <span className="font-medium text-foreground">{filter.value}</span>
          <button 
            onClick={() => onRemove(filter.id)} 
            className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5 text-muted-foreground hover:text-foreground"
          >
            <X className="w-3 h-3" />
          </button>
        </Badge>
      ))}
      <Button variant="ghost" size="sm" onClick={onClearAll} className="h-6 text-xs text-muted-foreground hover:text-destructive px-2">
        <FilterX className="w-3 h-3 mr-1" /> Clear All
      </Button>
    </div>
  );
};

// 37. BillingExportMenu
export const BillingExportMenu: React.FC<{
  onExport: (format: 'csv' | 'pdf') => void;
  isExporting?: boolean;
}> = ({ onExport, isExporting }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2" disabled={isExporting}>
          <Download className="w-4 h-4" />
          {isExporting ? 'Exporting...' : 'Export'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onExport('csv')} className="cursor-pointer">
          <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onExport('pdf')} className="cursor-pointer">
          <FileText className="w-4 h-4 mr-2 text-red-600" />
          Export as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// 38. BillingFilterDrawer
export const BillingFilterDrawer: React.FC<{
  children: React.ReactNode;
  activeFilterCount: number;
  onClear: () => void;
  onApply: () => void;
}> = ({ children, activeFilterCount, onClear, onApply }) => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-1">{activeFilterCount}</Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Advanced Filters</SheetTitle>
        </SheetHeader>
        <div className="py-6 space-y-6">
          {children}
        </div>
        <SheetFooter className="gap-2 sm:justify-between border-t pt-4">
          <Button variant="ghost" onClick={onClear}>Clear All</Button>
          <SheetClose asChild>
            <Button onClick={onApply}>Apply Filters</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

// 39. ColumnVisibilityMenu
export const ColumnVisibilityMenu: React.FC<{
  columns: { id: string; label: string; isVisible: boolean }[];
  onToggle: (id: string, isVisible: boolean) => void;
}> = ({ columns, onToggle }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="ml-auto gap-2">
          <Settings2 className="w-4 h-4" />
          Columns
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        {columns.map((col) => (
          <DropdownMenuCheckboxItem
            key={col.id}
            checked={col.isVisible}
            onCheckedChange={(val) => onToggle(col.id, val)}
          >
            {col.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// 40. BulkActionToolbar
export const BulkActionToolbar: React.FC<{
  selectedCount: number;
  onClear: () => void;
  onAction: (action: string) => void;
}> = ({ selectedCount, onClear, onAction }) => {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center justify-between p-2 bg-primary/5 border border-primary/20 rounded-md mb-4 text-sm animate-in fade-in zoom-in-95 duration-200">
      <div className="flex items-center gap-2 text-primary font-medium">
        <Badge variant="default" className="bg-primary text-primary-foreground">
          {selectedCount}
        </Badge>
        items selected
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => onAction('approve')} className="text-green-600 hover:text-green-700 hover:bg-green-50">
          <CheckCircle2 className="w-4 h-4 mr-2" /> Approve Selected
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onAction('delete')} className="text-destructive hover:text-destructive hover:bg-destructive/10">
          <Trash2 className="w-4 h-4 mr-2" /> Delete Selected
        </Button>
        <div className="w-px h-4 bg-border mx-1" />
        <Button variant="ghost" size="sm" onClick={onClear} className="text-muted-foreground">
          <X className="w-4 h-4 mr-2" /> Cancel
        </Button>
      </div>
    </div>
  );
};
