import React from 'react';
import { Outlet } from 'react-router-dom';
import { BillingNavigation } from './BillingNavigation';
import { Button } from '@/components/marketing_ui/button';
import { FileDown, RefreshCw } from 'lucide-react';

export const BillingShell = () => {
  return (
    <div className="min-h-screen bg-background p-6 md:p-8 lg:p-10">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Global Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Billing Command Center</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Global oversight of subscriptions, transactions, and revenue.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="hidden sm:flex">
              <FileDown className="mr-2 h-4 w-4" />
              Global Report
            </Button>
            <Button size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Reconcile All
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <BillingNavigation />

        {/* Content Area */}
        <div className="bg-card rounded-xl border border-border shadow-sm min-h-[600px] p-6 relative">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
