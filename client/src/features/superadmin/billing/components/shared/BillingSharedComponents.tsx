/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

/*
 * ─────────────────────────────────────────────────────────
 * 🚨 CRITICAL AI AND SYSTEM RULES 🚨
 * 1. NEVER DELETE ANY ENVIRONMENT VARIABLES.
 * 2. LOCALHOST TESTING IS STRICTLY BANNED. NO AI WILL EVER TRY TO WORK LOCALLY.
 * 3. THIS REPO IS PRODUCTION-FIRST. DO NOT TOUCH OR REMOVE KEYS.
 * ─────────────────────────────────────────────────────────
 */

/*
 * ─────────────────────────────────────────────────────────
 * 🚨 NAMING CONVENTION RULE 🚨
 * 1. "CLASSGRID PLATFORM" is strictly the REPO NAME.
 * 2. "CLASSGRID ERP" is the actual PRODUCT NAME.
 * 3. NEVER use "Classgrid Platform" anywhere in the frontend UI or user-facing text.
 * ─────────────────────────────────────────────────────────
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
