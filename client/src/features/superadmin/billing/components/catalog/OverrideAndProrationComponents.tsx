import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/marketing_ui/dialog';
import { Combobox } from '@/components/marketing_ui/combobox';
import { Button } from '@/components/marketing_ui/button';
import { Input } from '@/components/marketing_ui/input';
import { Label } from '@/components/marketing_ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/marketing_ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/marketing_ui/card';
import { AlertCircle, FileText } from 'lucide-react';
import { MoneyDisplay, AsyncBillingState } from '../shared/BillingStateComponents';
import { useBillingModules } from '../../hooks/useBillingCatalog';
import { usePricingOverrides, useSetPricingOverride } from '../../hooks/useBillingSubscriptions';

// 16. ModuleAssignmentDialog
export const ModuleAssignmentDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  orgId: string;
}> = ({ isOpen, onClose, orgId }) => {
  const { data: modules, isLoading } = useBillingModules();
  const [selectedModule, setSelectedModule] = useState<string>('');

  const moduleOptions = modules?.map((m: any) => ({ label: m.name, value: m._id })) || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Add-on Module</DialogTitle>
        </DialogHeader>
        <AsyncBillingState loading={isLoading} skeletonType="form">
          <div className="py-6 space-y-4">
            <div className="space-y-2">
              <Label>Select Module</Label>
              <Combobox
                options={moduleOptions}
                value={selectedModule}
                onSelect={setSelectedModule}
                placeholder="Search modules..."
              />
            </div>
            <div className="p-3 bg-primary/10 text-primary text-sm rounded-md border border-primary/20">
              Billing will start immediately. A prorated invoice will be generated for the remainder of the current cycle.
            </div>
          </div>
        </AsyncBillingState>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button disabled={!selectedModule}>Assign Module</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// 17. ModuleOverrideDialog
export const ModuleOverrideDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  orgId: string;
  moduleId: string;
  moduleName: string;
  currentPricePaise: number;
}> = ({ isOpen, onClose, orgId, moduleId, moduleName, currentPricePaise }) => {
  const { mutateAsync: setOverride, isPending } = useSetPricingOverride();
  const [overridePrice, setOverridePrice] = useState(String(currentPricePaise));

  const handleSave = async () => {
    await setOverride({ orgId, moduleId, overridePricePaise: Number(overridePrice) });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set Custom Pricing</DialogTitle>
        </DialogHeader>
        <div className="py-6 space-y-6">
          <div className="bg-muted p-3 rounded-md">
            <p className="text-sm text-muted-foreground">Module</p>
            <p className="font-semibold">{moduleName}</p>
          </div>
          <div className="space-y-2">
            <Label>New Unit Price (Paise)</Label>
            <Input 
              type="number" 
              value={overridePrice}
              onChange={e => setOverridePrice(e.target.value)} 
              placeholder={String(currentPricePaise)} 
            />
            <p className="text-xs text-muted-foreground pt-1">
              This price will override the standard catalog price for this organization only.
            </p>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={isPending}>{isPending ? 'Saving...' : 'Save Custom Price'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// 18. OrganizationPricingOverrideTable
export const OrganizationPricingOverrideTable: React.FC<{ orgId: string }> = ({ orgId }) => {
  const { data: overrides, isLoading } = usePricingOverrides(orgId);
  const [selectedModule, setSelectedModule] = useState<any>(null);

  if (isLoading) return <AsyncBillingState loading={true} skeletonType="table" />;

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Module</TableHead>
            <TableHead>Custom Price</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {overrides?.length ? overrides.map((override: any) => (
            <TableRow key={override._id}>
              <TableCell>{override.moduleId?.name}</TableCell>
              <TableCell><MoneyDisplay amountPaise={override.overridePricePaise} /></TableCell>
              <TableCell>
                <Button variant="outline" size="sm" onClick={() => setSelectedModule(override.moduleId)}>Edit</Button>
              </TableCell>
            </TableRow>
          )) : (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-muted-foreground">No overrides found.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      
      {selectedModule && (
        <ModuleOverrideDialog 
          isOpen={!!selectedModule}
          onClose={() => setSelectedModule(null)}
          orgId={orgId}
          moduleId={selectedModule._id}
          moduleName={selectedModule.name}
          currentPricePaise={0}
        />
      )}
    </div>
  );
};

// 19. ProrationPreview
export const ProrationPreview: React.FC<{
  unusedTimeCredit: number;
  newTimeDebit: number;
  netChange: number;
}> = ({ unusedTimeCredit, newTimeDebit, netChange }) => {
  return (
    <Card className="border-primary/20 shadow-sm">
      <CardHeader className="pb-2 bg-primary/5 rounded-t-xl">
        <CardTitle className="text-lg flex items-center">
          <AlertCircle className="w-5 h-5 mr-2 text-primary" />
          Proration Calculation Preview
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Credit for unused time on current plan:</span>
            <span className="text-primary font-medium"><MoneyDisplay amountPaise={unusedTimeCredit} /></span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Debit for remaining time on new plan:</span>
            <span className="text-destructive font-medium"><MoneyDisplay amountPaise={newTimeDebit} /></span>
          </div>
          <div className="border-t pt-3 mt-3 flex justify-between items-center">
            <span className="font-semibold text-foreground">Net Amount Due Now:</span>
            <span className="font-bold text-lg"><MoneyDisplay amountPaise={netChange} /></span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// 20. UpcomingInvoicePreview
export const UpcomingInvoicePreview: React.FC<{
  lineItems: { desc: string; amount: number }[];
  total: number;
}> = ({ lineItems, total }) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center">
          <FileText className="w-5 h-5 mr-2 text-muted-foreground" />
          Draft Invoice Preview
        </CardTitle>
        <CardDescription>Generated on-the-fly for the next billing cycle.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lineItems.map((item, idx) => (
              <TableRow key={idx}>
                <TableCell>{item.desc}</TableCell>
                <TableCell className="text-right"><MoneyDisplay amountPaise={item.amount} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="flex justify-end pt-4 mt-2 border-t">
          <div className="text-right">
            <p className="text-sm text-muted-foreground mb-1">Estimated Total (excl. Tax)</p>
            <p className="text-xl font-bold"><MoneyDisplay amountPaise={total} /></p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
