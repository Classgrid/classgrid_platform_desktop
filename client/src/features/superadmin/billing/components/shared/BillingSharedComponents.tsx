import React from 'react';
import { Badge } from '@/components/marketing_ui/badge';
import { Button } from '@/components/marketing_ui/button';
import { Input } from '@/components/marketing_ui/input';
import { Select } from '@/components/marketing_ui/select';
import { Search, Filter, Columns, Download, Archive, RefreshCw } from 'lucide-react';

// 1. BillingPermissionGuard
export const BillingPermissionGuard: React.FC<{ children: React.ReactNode; userRole: string }> = ({ children, userRole }) => {
  if (userRole !== 'SUPER_ADMIN' && userRole !== 'BILLING_ADMIN') return <div>Unauthorized</div>;
  return <>{children}</>;
};

// 2. BillingPageHeader
export const BillingPageHeader: React.FC<{ title: string; subtitle?: string; actions?: React.ReactNode }> = ({ title, subtitle, actions }) => (
  <div className="flex justify-between items-center mb-6">
    <div>
      <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
      {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
    </div>
    {actions && <div className="flex gap-2">{actions}</div>}
  </div>
);

// 3. BillingDataTable (Wrapper around standard shadcn table or plain table)
export const BillingDataTable: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="rounded-md border">{children}</div>
);

// 4. BillingPagination
export const BillingPagination: React.FC = () => (
  <div className="flex items-center justify-end space-x-2 py-4">
    <Button variant="outline" size="sm">Previous</Button>
    <Button variant="outline" size="sm">Next</Button>
  </div>
);

// 5. BillingSearchInput
export const BillingSearchInput: React.FC<{ placeholder?: string }> = ({ placeholder = "Search..." }) => (
  <div className="relative w-72">
    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
    <Input placeholder={placeholder} className="pl-8" />
  </div>
);

// 6. BillingFilterDrawer
export const BillingFilterDrawer: React.FC = () => (
  <Button variant="outline" size="sm"><Filter className="mr-2 h-4 w-4" /> Filters</Button>
);

// 7. ActiveFilterChips
export const ActiveFilterChips: React.FC = () => (
  <div className="flex gap-2 mb-4">
    <Badge variant="secondary">Type: School</Badge>
  </div>
);

// 8. DateRangePicker (Placeholder for complex shadcn date picker)
export const DateRangePicker: React.FC = () => (
  <Button variant="outline" size="sm">Pick a date range</Button>
);

// 9. OrganizationSelector
export const OrganizationSelector: React.FC = () => (
  <Select />
);

// 10. OrganizationTypeFilter
export const OrganizationTypeFilter: React.FC = () => (
  <Select />
);

// 11. StructureTypeFilter
export const StructureTypeFilter: React.FC = () => (
  <Select />
);

// 12. SavedViewSelector
export const SavedViewSelector: React.FC = () => (
  <Select />
);

// 13. ColumnVisibilityMenu
export const ColumnVisibilityMenu: React.FC = () => (
  <Button variant="outline" size="sm"><Columns className="mr-2 h-4 w-4" /> Columns</Button>
);

// 14. BillingExportMenu
export const BillingExportMenu: React.FC = () => (
  <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" /> Export</Button>
);

// 15. BulkActionToolbar
export const BulkActionToolbar: React.FC<{ count: number }> = ({ count }) => (
  <div className="bg-muted p-2 rounded-md flex items-center justify-between">
    <span className="text-sm font-medium">{count} selected</span>
    <Button variant="secondary" size="sm"><Archive className="mr-2 h-4 w-4" /> Archive</Button>
  </div>
);

// 16. BillingAuditTimeline
export const BillingAuditTimeline: React.FC = () => (
  <div className="space-y-4">Timeline goes here</div>
);

// 17. BillingEmptyState
export const BillingEmptyState: React.FC<{ title: string }> = ({ title }) => (
  <div className="text-center py-10">
    <h3 className="text-lg font-semibold">{title}</h3>
    <p className="text-muted-foreground text-sm">No data available at this time.</p>
  </div>
);

// 18. BillingErrorBoundary
export class BillingErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return <div className="p-4 text-red-500 bg-red-50">Error rendering billing component.</div>;
    return this.props.children;
  }
}

// 19. AsyncBillingState
export const AsyncBillingState: React.FC<{ loading: boolean; children: React.ReactNode }> = ({ loading, children }) => (
  loading ? <div>Loading...</div> : <>{children}</>
);

// 20. MoneyDisplay
export const MoneyDisplay: React.FC<{ amountPaise: number }> = ({ amountPaise }) => {
  return <span className="font-medium">₹{(amountPaise / 100).toLocaleString('en-IN')}</span>;
};

// 21. BillingStatusBadge
export const BillingStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const variant = status === 'PAID' || status === 'ACTIVE' ? 'default' : 'secondary';
  return <Badge variant={variant}>{status}</Badge>;
};

// 22. OrganizationBillingContextBadge
export const OrganizationBillingContextBadge: React.FC<{ orgType: string }> = ({ orgType }) => (
  <Badge variant="outline">{orgType}</Badge>
);
