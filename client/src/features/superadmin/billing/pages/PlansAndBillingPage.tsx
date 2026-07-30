import React, { useState } from 'react';
import { useSubscriptions, useSubscriptionOverview } from '../hooks/useBillingSubscriptions';
import { useBillingPlans, useBillingModules } from '../hooks/useBillingCatalog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../../components/marketing_ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/marketing_ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../../../components/marketing_ui/table';
import { Badge } from '../../../../components/marketing_ui/badge';
import { Button } from '../../../../components/marketing_ui/button';
import { Spinner } from '../../../../components/marketing_ui/spinner';
import { Globe, Users, Clock, Building2 } from 'lucide-react';

const PlansAndBillingPage = () => {
  const { data: overviewData, isLoading: overviewLoading } = useSubscriptionOverview();
  const { data: subscriptionsData, isLoading: subscriptionsLoading } = useSubscriptions();
  const { data: plansData, isLoading: plansLoading } = useBillingPlans();
  const { data: modulesData, isLoading: modulesLoading } = useBillingModules();

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      {/* Page Header */}
      <div className="flex justify-between items-center p-6 border-b border-border bg-card">
        <h2 className="text-xl font-semibold tracking-tight">Plans & Billing Ecosystem</h2>
        <Button variant="default">+ Create Plan</Button>
      </div>

      <div className="p-6 space-y-6">


        {/* Tabs for detailed view */}
        <Tabs defaultValue="organizations" className="w-full">
          <TabsList>
            <TabsTrigger value="organizations">Organizations</TabsTrigger>
            <TabsTrigger value="plans">Plans</TabsTrigger>
            <TabsTrigger value="modules">Modules</TabsTrigger>
          </TabsList>
          
          <TabsContent value="organizations" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Organizations</CardTitle>
                <p className="text-sm text-muted-foreground">Click 'Manage Plan' to update a subscription.</p>
              </CardHeader>
              <CardContent>
                {subscriptionsLoading ? (
                  <div className="flex justify-center p-6"><Spinner /></div>
                ) : subscriptionsData?.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Organization ID</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subscriptionsData.map((sub: any) => (
                        <TableRow key={sub._id}>
                          <TableCell className="font-medium">{sub.organizationId?.name || sub.organizationId}</TableCell>
                          <TableCell>{sub.billingPlanVersionId?.name || "N/A"}</TableCell>
                          <TableCell>
                            <Badge variant={sub.status === "ACTIVE" ? "default" : "secondary"}>
                              {sub.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center p-6 border rounded-lg bg-muted/50 text-muted-foreground text-sm">
                    No organizations match your search.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="plans" className="mt-4">
             <Card>
              <CardHeader>
                <CardTitle>Plans</CardTitle>
              </CardHeader>
              <CardContent>
                {plansLoading ? (
                  <div className="flex justify-center p-6"><Spinner /></div>
                ) : plansData?.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Plan Name</TableHead>
                        <TableHead>Tier Code</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {plansData.map((plan: any) => (
                        <TableRow key={plan._id}>
                          <TableCell className="font-medium">{plan.name}</TableCell>
                          <TableCell>{plan.tierCode}</TableCell>
                          <TableCell>
                            <Badge variant={plan.status === "ACTIVE" ? "default" : "secondary"}>
                              {plan.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center p-6 border rounded-lg bg-muted/50 text-muted-foreground text-sm">
                    No plans found.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="modules" className="mt-4">
             <Card>
              <CardHeader>
                <CardTitle>Modules</CardTitle>
              </CardHeader>
              <CardContent>
                {modulesLoading ? (
                  <div className="flex justify-center p-6"><Spinner /></div>
                ) : modulesData?.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Module Name</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {modulesData.map((mod: any) => (
                        <TableRow key={mod._id}>
                          <TableCell className="font-medium">{mod.name}</TableCell>
                          <TableCell>{mod.moduleCode}</TableCell>
                          <TableCell>
                            <Badge variant={mod.status === "ACTIVE" ? "default" : "secondary"}>
                              {mod.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center p-6 border rounded-lg bg-muted/50 text-muted-foreground text-sm">
                    No modules found.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PlansAndBillingPage;
