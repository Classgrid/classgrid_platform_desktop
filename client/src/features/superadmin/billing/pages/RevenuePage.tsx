import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/marketing_ui/card';
import { Button } from '../../../../components/marketing_ui/button';
import { Spinner } from '../../../../components/marketing_ui/spinner';
import { useExportRevenue, useRevenueOverview } from '../hooks/useBillingFinance';
import { RevenueViewTabs, RevenueOrganizationTable, RevenueModuleTable } from '../components/finance/RevenueComponents';
import { MoneyDisplay } from '../components/shared/BillingStateComponents';

const RevenuePage = () => {
  const [activeTab, setActiveTab] = useState('organizations');
  const { data: overview, isLoading: overviewLoading } = useRevenueOverview();
  const exportMutation = useExportRevenue();

  const handleExport = () => {
    exportMutation.mutate();
  };

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      <div className="flex justify-between items-center p-6 border-b border-border bg-card">
        <h2 className="text-xl font-semibold tracking-tight">Revenue Ledger</h2>
        <div className="flex gap-2 items-center">
          <Button 
            variant="outline" 
            onClick={handleExport}
            disabled={exportMutation.isPending}
          >
            {exportMutation.isPending ? <Spinner className="mr-2" /> : null}
            Prepare CSV export
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <p className="text-sm text-muted-foreground">
          This table displays only funds earned by Classgrid from SaaS subscriptions.
        </p>
        {exportMutation.isSuccess && (
          <p className="text-sm text-primary">
            Export job queued: {exportMutation.data?._id || exportMutation.data?.id}
          </p>
        )}
        {exportMutation.error && (
          <p className="text-sm text-destructive">{(exportMutation.error as Error).message}</p>
        )}

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Gross revenue</CardTitle></CardHeader>
            <CardContent className="text-2xl font-semibold">
              {overviewLoading ? '...' : <MoneyDisplay amountPaise={overview?.grossRevenuePaise || 0} />}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Gateway fees</CardTitle></CardHeader>
            <CardContent className="text-2xl font-semibold">
              {overviewLoading ? '...' : <MoneyDisplay amountPaise={overview?.totalGatewayFeesPaise || 0} />}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Net revenue</CardTitle></CardHeader>
            <CardContent className="text-2xl font-semibold">
              {overviewLoading ? '...' : <MoneyDisplay amountPaise={overview?.netRevenuePaise || 0} />}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Captured payments</CardTitle></CardHeader>
            <CardContent className="text-2xl font-semibold">
              {overviewLoading ? '...' : overview?.transactionCount || 0}
            </CardContent>
          </Card>
        </div>

        <RevenueViewTabs activeTab={activeTab} onTabChange={setActiveTab} />

        <Card>
          <CardHeader>
            <CardTitle>{activeTab === 'organizations' ? 'Revenue by Organization' : 'Revenue by Module'}</CardTitle>
            <p className="text-sm text-muted-foreground">Detailed breakdown of platform subscriptions.</p>
          </CardHeader>
          <CardContent className="p-0">
            {activeTab === 'organizations' ? (
              <RevenueOrganizationTable />
            ) : (
              <RevenueModuleTable />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RevenuePage;
