import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/marketing_ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/marketing_ui/card';
import { Button } from '@/components/marketing_ui/button';
import { Plus } from 'lucide-react';

export const PlansBillingTabs: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Plans & Billing Ecosystem</h2>
          <p className="text-muted-foreground">Manage the global catalog of plans, modules, and rules.</p>
        </div>
      </div>

      <Tabs defaultValue="plans" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="modules">Modules</TabsTrigger>
          <TabsTrigger value="eligibility">Eligibility Rules</TabsTrigger>
          <TabsTrigger value="taxes">Tax Rules</TabsTrigger>
          <TabsTrigger value="discounts">Discounts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="plans">
          {/* PlanCatalogTable goes here */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle>Base Plans</CardTitle>
                <CardDescription>Manage core subscription packages.</CardDescription>
              </div>
              <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Create Plan</Button>
            </CardHeader>
            <CardContent>
              {/* Table Component */}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="modules">
          {/* ModuleCatalogTable goes here */}
        </TabsContent>

        <TabsContent value="eligibility">
          {/* EligibilityRuleTable goes here */}
        </TabsContent>

        <TabsContent value="taxes">
          {/* TaxRuleTable goes here */}
        </TabsContent>

        <TabsContent value="discounts">
          {/* DiscountTable goes here */}
        </TabsContent>
      </Tabs>
    </div>
  );
};
