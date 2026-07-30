// 🛑 AI AGENT INSTRUCTION: DO NOT EDIT OR REFACTOR THIS FILE.
// The user explicitly requested that AI agents must NEVER modify this file,
// its layout, logic, or structure without extreme explicit permission.
// 🛑 STOP AND ASK BEFORE MAKING ANY CHANGES HERE.

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/marketing_ui/card';
import { RevenueViewTabs, RevenueOrganizationTable, RevenueModuleTable } from '../components/finance/RevenueComponents';
import { RevenueExportDialog, RevenueInvoiceTable } from '../components/finance/FinanceComponents';

const RevenuePage = () => {
  const [activeTab, setActiveTab] = useState('organizations');

  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      <div className="flex items-center justify-between border-b border-border bg-card p-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Revenue Ledger</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Only captured Classgrid SaaS subscription revenue is included.
          </p>
        </div>
        <RevenueExportDialog />
      </div>

      <div className="space-y-6 p-6">
        <RevenueViewTabs activeTab={activeTab} onTabChange={setActiveTab} />
        <Card>
          <CardHeader>
            <CardTitle>
              {activeTab === 'organizations'
                ? 'Revenue by Organization'
                : activeTab === 'modules'
                  ? 'Revenue by Module'
                  : 'Revenue by Invoice'}
            </CardTitle>
            <p className="text-sm text-muted-foreground">Detailed platform subscription revenue records.</p>
          </CardHeader>
          <CardContent className="p-0">
            {activeTab === 'organizations' && <RevenueOrganizationTable />}
            {activeTab === 'modules' && <RevenueModuleTable />}
            {activeTab === 'invoices' && <RevenueInvoiceTable />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RevenuePage;
