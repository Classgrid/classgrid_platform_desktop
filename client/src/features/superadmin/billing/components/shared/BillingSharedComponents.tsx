// Compatibility barrel for the original billing component inventory.
// Every export points to the live implementation used by the billing pages.
export {
  BillingPermissionGuard,
  BillingPageHeader,
  BillingSearchInput,
  BillingEmptyState,
} from './BillingLayoutComponents';

export { BillingDataTable } from './BillingDataTable';

export {
  BillingPagination,
  BillingFilterDrawer,
  ActiveFilterChips,
  DateRangePicker,
  OrganizationSelector,
  OrganizationTypeFilter,
  StructureTypeFilter,
  SavedViewSelector,
} from './BillingFilterComponents';

export {
  ColumnVisibilityMenu,
  BillingExportMenu,
  BulkActionToolbar,
  BillingAuditTimeline,
} from './BillingActionComponents';

export {
  BillingErrorBoundary,
  AsyncBillingState,
  MoneyDisplay,
  BillingStatusBadge,
  OrganizationBillingContextBadge,
} from './BillingStateComponents';
