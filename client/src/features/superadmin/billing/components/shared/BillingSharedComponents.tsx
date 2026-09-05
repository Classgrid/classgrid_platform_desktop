/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

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
