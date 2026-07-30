import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/marketing_ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/marketing_ui/card';
import { Button } from '@/components/marketing_ui/button';
import { Badge } from '@/components/marketing_ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/marketing_ui/tabs';
import { Building2, Package, TrendingUp } from 'lucide-react';
import { MoneyDisplay, AsyncBillingState } from '../shared/BillingStateComponents';
import { useRevenueByOrg, useRevenueByModule } from '../../hooks/useBillingFinance';

// 21. RevenueViewTabs
export const RevenueViewTabs: React.FC<{
  activeTab: string;
  onTabChange: (tab: string) => void;
}> = ({ activeTab, onTabChange }) => {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full mb-6">
      <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
        <TabsTrigger value="organizations" className="flex items-center gap-2">
          <Building2 className="w-4 h-4" /> By Organization
        </TabsTrigger>
        <TabsTrigger value="modules" className="flex items-center gap-2">
          <Package className="w-4 h-4" /> By Add-on Module
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
};

// 22. RevenueOrganizationTable
export const RevenueOrganizationTable: React.FC = () => {
  const { data: revenueData, isLoading, error } = useRevenueByOrg();

  return (
    <div className="rounded-md border bg-card">
      <AsyncBillingState loading={isLoading} error={error} skeletonType="table">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Organization</TableHead>
              <TableHead>Active Plan</TableHead>
              <TableHead className="text-right">Current MRR</TableHead>
              <TableHead className="text-right">YTD Revenue</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {revenueData?.map((item: any) => (
              <TableRow key={item._id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    {item.organization?.sidebar_name || item.organization?.name || item._id}
                  </div>
                </TableCell>
                <TableCell>Classgrid subscription</TableCell>
                <TableCell className="text-right font-medium text-primary">
                  <MoneyDisplay amountPaise={item.grossRevenuePaise} />
                </TableCell>
                <TableCell className="text-right">
                  <MoneyDisplay amountPaise={item.grossRevenuePaise} />
                </TableCell>
              </TableRow>
            ))}
            {revenueData?.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                  No revenue data found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </AsyncBillingState>
    </div>
  );
};

// 23. RevenueModuleTable
export const RevenueModuleTable: React.FC = () => {
  const { data: revenueData, isLoading, error } = useRevenueByModule();

  return (
    <div className="rounded-md border bg-card">
      <AsyncBillingState loading={isLoading} error={error} skeletonType="table">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Add-on Module</TableHead>
              <TableHead className="text-right">Active Subscriptions</TableHead>
              <TableHead className="text-right">Monthly Revenue</TableHead>
              <TableHead className="text-right">% of Total Add-on MRR</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {revenueData?.map((item: any) => (
              <TableRow key={item.moduleId}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    {item.module?.name || item.moduleId}
                  </div>
                </TableCell>
                <TableCell className="text-right">{item.activeCount}</TableCell>
                <TableCell className="text-right font-medium text-primary">
                  <MoneyDisplay amountPaise={item.mrrPaise} />
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant="secondary">{item.percentageOfTotal}%</Badge>
                </TableCell>
              </TableRow>
            ))}
            {revenueData?.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                  No module revenue data found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </AsyncBillingState>
    </div>
  );
};
