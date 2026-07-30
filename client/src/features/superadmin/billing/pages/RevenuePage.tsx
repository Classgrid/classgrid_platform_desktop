import React, { useState } from 'react';
import { useRevenueOverview, useRevenueByInvoice, useExportRevenue } from '../hooks/useBillingFinance';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/marketing_ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../../../components/marketing_ui/table';
import { Button } from '../../../../components/marketing_ui/button';
import { Spinner } from '../../../../components/marketing_ui/spinner';
import { TrendingUp, DollarSign, ArrowDownRight, Building } from 'lucide-react';
import { Input } from '../../../../components/marketing_ui/input'; // Assuming input exists or use native with standard styling wrapper
import { rupeesToPaise, paiseToRupees } from '../../../../utils/moneyUtils'; // Assuming we want formatted display

const RevenuePage = () => {
  const [dateFilter, setDateFilter] = useState('');
  
  const { data: overview, isLoading: overviewLoading } = useRevenueOverview();
  const { data: invoices, isLoading: invoicesLoading } = useRevenueByInvoice();
  const exportMutation = useExportRevenue();

  const handleExport = () => {
    exportMutation.mutate();
  };

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      <div className="flex justify-between items-center p-6 border-b border-border bg-card">
        <h2 className="text-xl font-semibold tracking-tight">Revenue Ledger</h2>
        <div className="flex gap-2 items-center">
          <input 
            type="month" 
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
          <Button 
            variant="outline" 
            onClick={handleExport}
            disabled={exportMutation.isPending}
          >
            {exportMutation.isPending ? <Spinner size="sm" className="mr-2" /> : null}
            Export CSV
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <p className="text-sm text-muted-foreground">
          This table displays only funds earned by Classgrid from SaaS subscriptions.
        </p>



        {/* Ledger Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <p className="text-sm text-muted-foreground">Latest payments from organizations for platform subscriptions.</p>
          </CardHeader>
          <CardContent>
            {invoicesLoading ? (
              <div className="flex justify-center p-6"><Spinner /></div>
            ) : invoices?.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Invoice</TableHead>
                    <TableHead className="text-right">Gross Revenue</TableHead>
                    <TableHead className="text-right">Gateway Fee</TableHead>
                    <TableHead className="text-right">Net Settled</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv: any) => (
                    <TableRow key={inv._id}>
                      <TableCell>{new Date(inv.issueDate || inv.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium">{inv.organizationId?.name || 'Unknown Org'}</TableCell>
                      <TableCell className="text-primary hover:underline cursor-pointer">{inv.invoiceNumber}</TableCell>
                      <TableCell className="text-right">₹{(inv.totalPaise || 0) / 100}</TableCell>
                      <TableCell className="text-right text-destructive">-₹{(inv.feePaise || 0) / 100}</TableCell>
                      <TableCell className="text-right text-green-600 font-medium">
                        ₹{((inv.totalPaise || 0) - (inv.feePaise || 0)) / 100}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center p-6 border rounded-lg bg-muted/50 text-muted-foreground text-sm">
                No transactions available.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RevenuePage;
