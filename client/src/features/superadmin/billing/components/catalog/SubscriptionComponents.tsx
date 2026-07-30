import React, { useState } from 'react';
import { Chip } from '@/components/marketing_ui/chip';
import { SelectAdvanced } from '@/components/marketing_ui/select-advanced';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/marketing_ui/table';
import { StatusButton } from '@/components/marketing_ui/status-button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerClose, DrawerFooter } from '@/components/marketing_ui/drawer';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/marketing_ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/marketing_ui/dialog';
import { Button } from '@/components/marketing_ui/button';
import { Badge } from '@/components/marketing_ui/badge';
import { Label } from '@/components/marketing_ui/label';
import { X, Building2, Package, RefreshCw } from 'lucide-react';
import { BillingStatusBadge, AsyncBillingState, MoneyDisplay } from '../shared/BillingStateComponents';
import { useSubscriptions, useSubscriptionDetail, useAssignSubscriptionPlan } from '../../hooks/useBillingSubscriptions';
import { useBillingPlans } from '../../hooks/useBillingCatalog';

// 11. ModuleEligibilityEditor
export const ModuleEligibilityEditor: React.FC<{
  allowedTypes: string[];
  orgTypeOptions: { label: string; value: string }[];
  onAdd: (type: string) => void;
  onRemove: (type: string) => void;
}> = ({ allowedTypes, orgTypeOptions, onAdd, onRemove }) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {allowedTypes.map(type => (
          <Chip key={type} variant="default" className="flex items-center gap-1">
            {type}
            <button onClick={() => onRemove(type)} className="hover:bg-muted-foreground/20 rounded-full p-0.5">
              <X className="h-3 w-3" />
            </button>
          </Chip>
        ))}
        {allowedTypes.length === 0 && <span className="text-sm text-muted-foreground">Available to all organization types.</span>}
      </div>
      <SelectAdvanced
        options={orgTypeOptions}
        value=""
        onChange={onAdd}
        placeholder="Restrict to org type..."
      />
    </div>
  );
};

// 12. BillingMetricSelector
export const BillingMetricSelector: React.FC<{
  value: string;
  metricOptions: { label: string; value: string; description: string }[];
  onChange: (val: string) => void;
}> = ({ value, metricOptions, onChange }) => {
  return (
    <SelectAdvanced
      value={value}
      onChange={onChange}
      placeholder="Select usage metric..."
      options={metricOptions}
    />
  );
};

// 13. OrganizationSubscriptionTable
export const OrganizationSubscriptionTable: React.FC<{
  onManage: (orgId: string) => void;
}> = ({ onManage }) => {
  const { data: subscriptions, isLoading, error } = useSubscriptions();

  return (
    <AsyncBillingState loading={isLoading} error={error} skeletonType="table">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Organization</TableHead>
            <TableHead>Active Plan</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Next Billing</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subscriptions?.map((sub: any) => (
            <TableRow key={sub.orgId}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  {sub.organization?.name || sub.orgId}
                </div>
              </TableCell>
              <TableCell>{sub.plan?.name || 'Custom'}</TableCell>
              <TableCell><BillingStatusBadge status={sub.status} asButton /></TableCell>
              <TableCell>{new Date(sub.currentPeriodEnd).toLocaleDateString()}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" onClick={() => onManage(sub.orgId)}>Manage</Button>
              </TableCell>
            </TableRow>
          ))}
          {subscriptions?.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                No active subscriptions found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </AsyncBillingState>
  );
};

// 14. OrganizationSubscriptionDrawer
export const OrganizationSubscriptionDrawer: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  orgId: string;
}> = ({ isOpen, onClose, orgId }) => {
  const { data: subDetail, isLoading, error } = useSubscriptionDetail(orgId);

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-w-2xl ml-auto right-0 left-auto h-full rounded-l-xl rounded-r-none">
        <DrawerHeader className="border-b pb-4">
          <DrawerTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {subDetail?.organization?.name || 'Organization'} Subscription
          </DrawerTitle>
        </DrawerHeader>
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          <AsyncBillingState loading={isLoading} error={error} skeletonType="card">
            
            {subDetail && (
              <>
                <div className="flex justify-between items-start bg-card p-4 rounded-lg border">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Current Plan</p>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      {subDetail.plan?.name} <Badge variant="secondary">v{subDetail.planVersion?.versionNumber}</Badge>
                    </h3>
                  </div>
                  <BillingStatusBadge status={subDetail.status} asButton />
                </div>

        <Accordion className="w-full">
                  <AccordionItem value="modules">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-2 font-medium">
                        <Package className="h-4 w-4" /> Active Add-on Modules ({subDetail.modules?.length || 0})
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 pt-2">
                        {subDetail.modules?.map((mod: any) => (
                          <div key={mod.moduleId} className="flex justify-between items-center p-3 border rounded-md">
                            <div>
                              <p className="font-medium">{mod.name}</p>
                              <p className="text-xs text-muted-foreground">{mod.pricingType}</p>
                            </div>
                            <Badge variant="outline"><MoneyDisplay amountPaise={mod.monthlyPricePaise} /> / cycle</Badge>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="history">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-2 font-medium">
                        <RefreshCw className="h-4 w-4" /> Billing Cycles
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm text-muted-foreground pt-2">Cycle history will appear here.</p>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </>
            )}
          </AsyncBillingState>
        </div>
        <DrawerFooter className="border-t">
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

// 15. PlanAssignmentDialog
export const PlanAssignmentDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  orgId: string;
}> = ({ isOpen, onClose, orgId }) => {
  const { data: plans, isLoading } = useBillingPlans();
  const [selectedPlanVersionId, setSelectedPlanVersionId] = useState('');
  const assignment = useAssignSubscriptionPlan();
  const planOptions = plans?.map((plan: any) => ({
    label: plan.name,
    value: plan.activeVersionId?._id || plan.activeVersionId,
  })).filter((option: any) => option.value) || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign New Base Plan</DialogTitle>
        </DialogHeader>
        <AsyncBillingState loading={isLoading} skeletonType="form">
          <div className="py-6 space-y-4">
            <div className="space-y-2">
              <Label>Select Plan</Label>
              <SelectAdvanced
                options={planOptions}
                value={selectedPlanVersionId}
                onChange={setSelectedPlanVersionId}
                placeholder="Search plans..."
              />
            </div>
            <div className="p-3 bg-primary/10 text-primary text-sm rounded-md border border-primary/20">
              Assigning a new base plan will trigger a proration event for the current billing cycle.
            </div>
          </div>
        </AsyncBillingState>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            disabled={isLoading || !selectedPlanVersionId || assignment.isPending}
            onClick={() => assignment.mutate(
              { orgId, billingPlanVersionId: selectedPlanVersionId },
              { onSuccess: onClose }
            )}
          >
            {assignment.isPending ? 'Assigning...' : 'Assign plan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
