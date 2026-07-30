import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/marketing_ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/marketing_ui/table';
import { Badge } from '@/components/marketing_ui/badge';
import { Button } from '@/components/marketing_ui/button';
import { Download, Building2, Box, FileText, ArrowRightCircle, RefreshCcw, Landmark, ShieldCheck, HelpCircle, CheckCircle2 } from 'lucide-react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose, DrawerFooter } from '@/components/marketing_ui/drawer';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/marketing_ui/dialog';

// --- REVENUE COMPONENTS (10) ---

// 1. RevenueViewTabs
export const RevenueViewTabs: React.FC = () => <div>Tabs: By Org, By Module, By Invoice</div>;

// 2. RevenueOrganizationTable
export const RevenueOrganizationTable: React.FC = () => (
  <Table>
    <TableHeader><TableRow><TableHead>Org</TableHead><TableHead>Gross Revenue</TableHead></TableRow></TableHeader>
    <TableBody><TableRow><TableCell>Org 1</TableCell><TableCell>₹25,000</TableCell></TableRow></TableBody>
  </Table>
);

// 3. RevenueModuleTable
export const RevenueModuleTable: React.FC = () => <div>Revenue grouped by Module</div>;

// 78. RevenueInvoiceTable
export const RevenueInvoiceTable: React.FC = () => {
  const { data: invoices, isLoading, error } = useRevenueByInvoice();

  return (
    <div className="rounded-md border bg-card">
      <AsyncBillingState loading={isLoading} error={error} skeletonType="table">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Billed Amount</TableHead>
              <TableHead className="text-right">Tax</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices?.map((inv: any) => (
              <TableRow key={inv.id}>
                <TableCell className="font-mono font-medium text-sm">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    {inv.invoiceNumber}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{inv.organization?.name || inv.orgId}</TableCell>
                <TableCell className="text-sm">{inv.issuedAt ? format(new Date(inv.issuedAt), 'MMM dd, yyyy') : '-'}</TableCell>
                <TableCell className="text-right font-medium">
                  <MoneyDisplay amountPaise={inv.totalAmountPaise} />
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  <MoneyDisplay amountPaise={inv.taxPaise} />
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" className="h-8 gap-1">
                    Details <ArrowRightCircle className="w-3 h-3" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {invoices?.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                  No invoice data available for this period.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </AsyncBillingState>
    </div>
  );
};

// 79. ModulePriceBreakdown
export const ModulePriceBreakdown: React.FC<{ moduleName: string; stats: any }> = ({ moduleName, stats }) => (
  <Card>
    <CardHeader className="py-3 px-4 border-b">
      <CardTitle className="text-sm font-medium flex items-center gap-2">
        <Box className="w-4 h-4 text-muted-foreground" />
        {moduleName} Unit Breakdown
      </CardTitle>
    </CardHeader>
    <CardContent className="p-4 space-y-4">
      <div className="flex justify-between items-center text-sm border-b pb-2">
        <span className="text-muted-foreground">Total Active Users</span>
        <span className="font-medium">{stats?.userCount || 0}</span>
      </div>
      <div className="flex justify-between items-center text-sm border-b pb-2">
        <span className="text-muted-foreground">Avg Revenue Per User</span>
        <span className="font-medium"><MoneyDisplay amountPaise={stats?.arpuPaise || 0} /></span>
      </div>
      <div className="flex justify-between items-center text-sm border-b pb-2">
        <span className="text-muted-foreground">Discount Applied</span>
        <span className="font-medium text-destructive">-<MoneyDisplay amountPaise={stats?.discountPaise || 0} /></span>
      </div>
      <div className="flex justify-between items-center text-sm">
        <span className="font-semibold text-primary">Net Revenue</span>
        <span className="font-bold text-primary"><MoneyDisplay amountPaise={stats?.netRevenuePaise || 0} /></span>
      </div>
    </CardContent>
  </Card>
);

// 80. SettlementStatusPanel
export const SettlementStatusPanel: React.FC<{ settlementInfo: any }> = ({ settlementInfo }) => (
  <div className="p-4 rounded-lg border bg-muted/20">
    <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
      <Landmark className="w-4 h-4" /> Settlement Status
    </h4>
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">Gateway Provider</p>
        <p className="text-sm font-medium">{settlementInfo?.provider || 'Razorpay'}</p>
      </div>
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">Batch ID</p>
        <p className="text-sm font-mono">{settlementInfo?.batchId || '-'}</p>
      </div>
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">Status</p>
        {settlementInfo?.status === 'SETTLED' ? (
          <Badge variant="success" className="gap-1"><CheckCircle2 className="w-3 h-3" /> Settled</Badge>
        ) : (
          <Badge variant="warning">Pending</Badge>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">Date</p>
        <p className="text-sm">{settlementInfo?.date ? format(new Date(settlementInfo.date), 'MMM dd, yyyy') : '-'}</p>
      </div>
    </div>
  </div>
);

// 81. InvoicePreviewPanel
export const InvoicePreviewPanel: React.FC<{ invoice: any }> = ({ invoice }) => (
  <Card>
    <CardHeader className="py-3 px-4 border-b">
      <CardTitle className="text-sm font-medium flex items-center gap-2">
        <FileText className="w-4 h-4 text-muted-foreground" />
        Associated Invoice
      </CardTitle>
    </CardHeader>
    <CardContent className="p-4">
      <div className="flex justify-between items-center">
        <div>
          <p className="font-mono text-sm">{invoice?.invoiceNumber}</p>
          <p className="text-xs text-muted-foreground">{invoice?.issuedAt ? format(new Date(invoice.issuedAt), 'MMM dd, yyyy') : '-'}</p>
        </div>
        <Badge>{invoice?.status || 'DRAFT'}</Badge>
      </div>
    </CardContent>
  </Card>
);

// 82. RevenueDetailDrawer
export const RevenueDetailDrawer: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  orgId: string;
}> = ({ isOpen, onClose, orgId }) => {
  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-w-2xl ml-auto right-0 left-auto h-full rounded-l-xl rounded-r-none">
        <DrawerHeader className="border-b pb-4 flex justify-between items-center">
          <DrawerTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Revenue Details
          </DrawerTitle>
          <DrawerClose asChild>
            <Button variant="ghost" size="sm">Close</Button>
          </DrawerClose>
        </DrawerHeader>
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          <ModulePriceBreakdown moduleName="Core Platform" stats={{ userCount: 1500, arpuPaise: 50000, discountPaise: 500000, netRevenuePaise: 70000000 }} />
          <SettlementStatusPanel settlementInfo={{ provider: 'Razorpay', batchId: 'set_Lx3P4', status: 'SETTLED', date: new Date().toISOString() }} />
          <InvoicePreviewPanel invoice={{ invoiceNumber: 'INV-2024-001', issuedAt: new Date().toISOString(), status: 'PAID' }} />
        </div>
      </DrawerContent>
    </Drawer>
  );
};

// 83. RevenueExportDialog
export const RevenueExportDialog: React.FC = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const exportMutation = useExportRevenue();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Revenue Report</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            This will export all current revenue data across all organizations, modules, and invoices based on your current filters.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button 
            disabled={exportMutation.isPending}
            onClick={() => exportMutation.mutate(undefined, { onSuccess: () => setIsOpen(false) })}
            className="gap-2"
          >
            <Download className="w-4 h-4" /> {exportMutation.isPending ? 'Exporting...' : 'Download CSV'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// 84. ReconciliationDialog
export const ReconciliationDialog: React.FC = () => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <RefreshCcw className="h-4 w-4" /> Run Reconciliation
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ledger Reconciliation</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="p-4 bg-muted/20 border rounded-lg flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-primary shrink-0" />
            <p className="text-sm">
              Running a reconciliation scan will cross-verify all Razorpay Gateway transactions against the internal MongoDB Ledger and Classgrid Invoice records to ensure 100% parity. Any mismatches will be flagged.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button onClick={() => setIsOpen(false)} className="gap-2">
            <ShieldCheck className="w-4 h-4" /> Start Scan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
