import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/marketing_ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/marketing_ui/table';
import { Button } from '@/components/marketing_ui/button';
import { Badge } from '@/components/marketing_ui/badge';

// 1. PlanCatalogTable
export const PlanCatalogTable: React.FC = () => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Plan Name</TableHead>
        <TableHead>Code</TableHead>
        <TableHead>Active Version</TableHead>
        <TableHead>Monthly Base</TableHead>
        <TableHead>Actions</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow>
        <TableCell>Enterprise Suite</TableCell>
        <TableCell>ENT_SUITE</TableCell>
        <TableCell>v3</TableCell>
        <TableCell>₹25,000</TableCell>
        <TableCell><Button variant="outline" size="sm">Edit</Button></TableCell>
      </TableRow>
    </TableBody>
  </Table>
);

// 2. PlanEditorDrawer
export const PlanEditorDrawer: React.FC = () => <div>Drawer for Plan editing</div>;

// 3. PlanVersionHistory
export const PlanVersionHistory: React.FC = () => <div>Version History List</div>;

// 4. PlanVersionComparison
export const PlanVersionComparison: React.FC = () => <div>Comparison between versions</div>;

// 5. PlanEligibilityEditor
export const PlanEligibilityEditor: React.FC = () => <div>Form to set allowed org types</div>;

// 6. ModuleCatalogTable
export const ModuleCatalogTable: React.FC = () => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Module Name</TableHead>
        <TableHead>Pricing Type</TableHead>
        <TableHead>Active Version</TableHead>
        <TableHead>Status</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow>
        <TableCell>SMS Gateway Add-on</TableCell>
        <TableCell>USAGE_BASED</TableCell>
        <TableCell>v1</TableCell>
        <TableCell><Badge>ACTIVE</Badge></TableCell>
      </TableRow>
    </TableBody>
  </Table>
);

// 7. ModuleEditorDrawer
export const ModuleEditorDrawer: React.FC = () => <div>Drawer for Module editing</div>;

// 8. ModuleVersionHistory
export const ModuleVersionHistory: React.FC = () => <div>Module Version History List</div>;

// 9. ModulePricingTypeSelector
export const ModulePricingTypeSelector: React.FC = () => <div>Select: FIXED vs PER_USER vs USAGE</div>;

// 10. ModuleEligibilityEditor
export const ModuleEligibilityEditor: React.FC = () => <div>Form for module eligibility rules</div>;

// 11. BillingMetricSelector
export const BillingMetricSelector: React.FC = () => <div>Select usage metric (e.g., ACTIVE_LEARNERS)</div>;

// 12. OrganizationSubscriptionTable
export const OrganizationSubscriptionTable: React.FC = () => (
  <Table>
    <TableHeader>
      <TableRow><TableHead>Org</TableHead><TableHead>Plan</TableHead><TableHead>Status</TableHead></TableRow>
    </TableHeader>
    <TableBody>
      <TableRow><TableCell>Org 1</TableCell><TableCell>Enterprise</TableCell><TableCell><Badge>ACTIVE</Badge></TableCell></TableRow>
    </TableBody>
  </Table>
);

// 13. OrganizationSubscriptionDrawer
export const OrganizationSubscriptionDrawer: React.FC = () => <div>Drawer showing full subscription details</div>;

// 14. PlanAssignmentDialog
export const PlanAssignmentDialog: React.FC = () => <div>Dialog to assign/change org plan</div>;

// 15. ModuleAssignmentDialog
export const ModuleAssignmentDialog: React.FC = () => <div>Dialog to add module to org</div>;

// 16. ModuleOverrideDialog
export const ModuleOverrideDialog: React.FC = () => <div>Dialog to override module price for org</div>;

// 17. OrganizationPricingOverrideTable
export const OrganizationPricingOverrideTable: React.FC = () => <div>Table listing current price overrides</div>;

// 18. ProrationPreview
export const ProrationPreview: React.FC = () => <div>Displays partial credit/debit calculation</div>;

// 19. UpcomingInvoicePreview
export const UpcomingInvoicePreview: React.FC = () => <div>Draft invoice generated on the fly</div>;

// 20. EffectiveDateSelector
export const EffectiveDateSelector: React.FC = () => <div>Select immediately vs next cycle</div>;

// 21. SubscriptionChangeReasonDialog
export const SubscriptionChangeReasonDialog: React.FC = () => <div>Prompt for reason before saving change</div>;

// 22. UsageMetricTable
export const UsageMetricTable: React.FC = () => <div>Table of captured usage metrics (GBs, SMS)</div>;

// 23. UsageCalculationPreview
export const UsageCalculationPreview: React.FC = () => <div>Preview of usage * rate calculation</div>;

// 24. InvoiceRulesPanel
export const InvoiceRulesPanel: React.FC = () => <div>Panel for net payment terms, sequence prefixes</div>;

// 25. DiscountManagementPanel
export const DiscountManagementPanel: React.FC = () => <div>Panel to create/manage discounts</div>;

// 26. DiscountRedemptionTable
export const DiscountRedemptionTable: React.FC = () => <div>Table of redeemed discounts</div>;

// 27. OrganizationCreditLedger
export const OrganizationCreditLedger: React.FC = () => (
  <Card>
    <CardHeader><CardTitle>Credit Ledger</CardTitle></CardHeader>
    <CardContent>Table showing credits granted vs applied</CardContent>
  </Card>
);

// 28. TaxConfigurationPanel
export const TaxConfigurationPanel: React.FC = () => <div>Panel for SGST/CGST/IGST rates</div>;

// 29. TaxRuleVersionHistory
export const TaxRuleVersionHistory: React.FC = () => <div>History of tax rate changes</div>;

// 30. PriceChangeConfirmationDialog
export const PriceChangeConfirmationDialog: React.FC = () => <div>Warning dialog before modifying base price</div>;

// 31. SubscriptionHistoryTimeline
export const SubscriptionHistoryTimeline: React.FC = () => <div>Timeline of plan/module changes for an org</div>;

// 32. TerminologyPricingPreview
export const TerminologyPricingPreview: React.FC = () => <div>Preview how 'Students' vs 'Learners' displays on invoice</div>;

