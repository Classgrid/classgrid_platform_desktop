import React from 'react';
import { Outlet } from 'react-router-dom';
import { BillingNavigation } from './BillingNavigation';

export const BillingShell = () => {
  return (
    <div className="min-h-full bg-background p-6 md:p-8">
      <div className="max-w-[1400px] mx-auto space-y-6">
        <div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Billing Command Center</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Global oversight of subscriptions, transactions, and revenue.
            </p>
          </div>
        </div>

        <BillingNavigation />

        <div className="min-h-[600px]">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
