import React, { useState } from 'react';
import { useSubscriptions, useSubscriptionOverview } from '../hooks/useBillingSubscriptions';
import { useBillingPlans, useBillingModules, useCreatePlan } from '../hooks/useBillingCatalog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../../components/marketing_ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/marketing_ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../../../components/marketing_ui/table';
import { Badge } from '../../../../components/marketing_ui/badge';
import { Button } from '../../../../components/marketing_ui/button';
import { Spinner } from '../../../../components/marketing_ui/spinner';
import { Globe, Users, Clock, Building2, Server } from 'lucide-react';
import { StatCard } from '../../../../components/marketing_ui/StatCard';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../../../../components/marketing_ui/dialog';
import { Input } from '../../../../components/marketing_ui/input';
import { Label } from '../../../../components/marketing_ui/label';

const PlansAndBillingPage = () => {
  const [createOpen, setCreateOpen] = useState(false);
  const [planName, setPlanName] = useState('');
  const [planCode, setPlanCode] = useState('');
  const createPlan = useCreatePlan();
  const { data: overviewData, isLoading: overviewLoading } = useSubscriptionOverview();
  const { data: subscriptionsData = [], isLoading: subscriptionsLoading } = useSubscriptions();
  const { data: plansData = [], isLoading: plansLoading } = useBillingPlans();
  const { data: modulesData = [], isLoading: modulesLoading } = useBillingModules();

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      {/* Page Header */}
      <div className="flex justify-between items-center p-6 border-b border-border bg-card">
        <h2 className="text-xl font-semibold tracking-tight">Plans & Billing Ecosystem</h2>
        <Button variant="default" onClick={() => setCreateOpen(true)}>+ Create Plan</Button>
      </div>

      <div className="p-6 space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard 
            title="Total Organizations" 
            value={overviewLoading ? "..." : (overviewData?.totalOrganizations || 0)} 
            icon={Building2} 
          />
          <StatCard 
            title="Active Subscriptions" 
            value={overviewLoading ? "..." : (overviewData?.activeOrgs || 0)} 
            icon={Server} 
          />
          <StatCard 
            title="Demo / Trial Orgs" 
            value={overviewLoading ? "..." : (overviewData?.demoTrialOrgs || 0)} 
            icon={Clock} 
          />
          <StatCard 
            title="Total Platform Users" 
            value={overviewLoading ? "..." : (overviewData?.totalUsersAcrossOrgs || 0)} 
            icon={Users} 
          />
        </div>

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
                          <TableCell>
                            {sub.billingPlanVersionId?.version
                              ? `Version ${sub.billingPlanVersionId.version}`
                              : "Not assigned"}
                          </TableCell>
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
                          <TableCell>{plan.code}</TableCell>
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
                          <TableCell>{mod.code}</TableCell>
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
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create billing plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="plan-name">Plan name</Label>
              <Input id="plan-name" value={planName} onChange={(event) => setPlanName(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-code">Plan code</Label>
              <Input
                id="plan-code"
                value={planCode}
                onChange={(event) => setPlanCode(event.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''))}
              />
            </div>
            {createPlan.error && (
              <p className="text-sm text-destructive">{(createPlan.error as Error).message}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button
              disabled={!planName.trim() || !planCode.trim() || createPlan.isPending}
              onClick={() => createPlan.mutate(
                { name: planName.trim(), code: planCode.trim(), currency: 'INR' },
                {
                  onSuccess: () => {
                    setPlanName('');
                    setPlanCode('');
                    setCreateOpen(false);
                  },
                }
              )}
            >
              {createPlan.isPending ? 'Creating...' : 'Create plan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlansAndBillingPage;
