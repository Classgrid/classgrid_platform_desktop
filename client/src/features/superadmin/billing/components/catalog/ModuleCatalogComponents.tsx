import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/marketing_ui/table';
import { Badge } from '@/components/marketing_ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetClose } from '@/components/marketing_ui/sheet';
import { Input } from '@/components/marketing_ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/marketing_ui/select';
import { Button } from '@/components/marketing_ui/button';
import { Combobox } from '@/components/marketing_ui/combobox';
import { Chip } from '@/components/marketing_ui/chip';
import { Checkbox } from '@/components/marketing_ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/marketing_ui/radio-group';
import { Label } from '@/components/marketing_ui/label';
import { BillingStatusBadge, MoneyDisplay, AsyncBillingState } from '../shared/BillingStateComponents';
import { X, Info } from 'lucide-react';
import { useBillingModules, useModuleVersions, useCreateModule } from '../../hooks/useBillingCatalog';
import { useState } from 'react';

// 6. PlanEligibilityEditor
export const PlanEligibilityEditor: React.FC<{
  allowedTypes: string[];
  onAdd: (type: string) => void;
  onRemove: (type: string) => void;
  isRestricted: boolean;
  onToggleRestricted: (restricted: boolean) => void;
}> = ({ allowedTypes, onAdd, onRemove, isRestricted, onToggleRestricted }) => {
  return (
    <div className="space-y-4 border rounded-lg p-4 bg-muted/10">
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="restrict-eligibility" 
          checked={isRestricted} 
          onCheckedChange={(checked) => onToggleRestricted(!!checked)} 
        />
        <label htmlFor="restrict-eligibility" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          Restrict plan to specific organization types
        </label>
      </div>

      {isRestricted && (
        <div className="pl-6 space-y-4 pt-2">
          <div className="flex flex-wrap gap-2">
            {allowedTypes.map(type => (
              <Chip key={type} variant="secondary" className="flex items-center gap-1">
                {type}
                <button onClick={() => onRemove(type)} className="hover:bg-muted-foreground/20 rounded-full p-0.5">
                  <X className="h-3 w-3" />
                </button>
              </Chip>
            ))}
          </div>
          <Combobox
            options={[
              { label: 'School', value: 'school' },
              { label: 'Engineering', value: 'engineering' },
              { label: 'Coaching', value: 'coaching' },
            ]}
            value=""
            onSelect={onAdd}
            placeholder="Add allowed org type..."
          />
        </div>
      )}
    </div>
  );
};

// 7. ModuleCatalogTable
export const ModuleCatalogTable: React.FC<{
  onEdit: (id: string) => void;
}> = ({ onEdit }) => {
  const { data: modules, isLoading, error } = useBillingModules();

  return (
    <div className="rounded-md border bg-card">
      <AsyncBillingState loading={isLoading} error={error} skeletonType="table">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Module Name</TableHead>
              <TableHead>Pricing Strategy</TableHead>
              <TableHead>Base Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {modules?.map((mod: any) => (
              <TableRow key={mod._id}>
                <TableCell className="font-medium">{mod.name}</TableCell>
                <TableCell><Badge variant="outline">{mod.pricingType}</Badge></TableCell>
                <TableCell><MoneyDisplay amountPaise={mod.activeVersionId?.monthlyPricePaise || 0} /></TableCell>
                <TableCell><BillingStatusBadge status={mod.status} /></TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => onEdit(mod._id)}>Configure</Button>
                </TableCell>
              </TableRow>
            ))}
            {modules?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No modules found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </AsyncBillingState>
    </div>
  );
};

// 8. ModuleEditorDrawer
export const ModuleEditorDrawer: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const { mutateAsync: createModule, isPending } = useCreateModule();
  const [formData, setFormData] = useState({ name: '', code: '', pricingType: 'FIXED', price: '' });

  const handleSave = async () => {
    await createModule({
      name: formData.name,
      code: formData.code,
      pricingType: formData.pricingType,
      monthlyPricePaise: Number(formData.price) // Simplified, actual form would have version fields too
    });
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Configure Add-on Module</SheetTitle>
        </SheetHeader>
        <div className="grid gap-6 py-6">
          <div className="grid gap-2">
            <Label>Module Name</Label>
            <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Advanced Analytics" />
          </div>
          <div className="grid gap-2">
            <Label>System Code</Label>
            <Input value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} placeholder="MOD_ADV_ANALYTICS" className="font-mono" />
          </div>
          
          <ModulePricingTypeSelector value={formData.pricingType} onChange={v => setFormData({ ...formData, pricingType: v })} />
          
          <div className="grid gap-2 pt-4 border-t">
            <Label>Unit Price (Paise)</Label>
            <Input type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} placeholder="50000" />
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <Info className="w-3 h-3 mr-1" /> Applied per billing cycle based on pricing strategy.
            </p>
          </div>
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline">Cancel</Button>
          </SheetClose>
          <Button onClick={handleSave} disabled={isPending}>{isPending ? 'Saving...' : 'Save Module'}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

// 9. ModuleVersionHistory
export const ModuleVersionHistory: React.FC<{
  moduleId: string;
}> = ({ moduleId }) => {
  const { data: versions, isLoading, error } = useModuleVersions(moduleId);

  return (
    <AsyncBillingState loading={isLoading} error={error} skeletonType="table">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Version</TableHead>
            <TableHead>Published Date</TableHead>
            <TableHead>Unit Price</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {versions?.map((v: any) => (
            <TableRow key={v.versionNumber}>
              <TableCell>v{v.versionNumber}</TableCell>
              <TableCell>{new Date(v.createdAt).toLocaleDateString()}</TableCell>
              <TableCell><MoneyDisplay amountPaise={v.monthlyPricePaise || 0} /></TableCell>
              <TableCell><BillingStatusBadge status={v.status || 'ACTIVE'} /></TableCell>
            </TableRow>
          ))}
          {versions?.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                No versions history found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </AsyncBillingState>
  );
};

// 10. ModulePricingTypeSelector
export const ModulePricingTypeSelector: React.FC<{
  value: string;
  onChange: (val: string) => void;
}> = ({ value, onChange }) => {
  return (
    <div className="grid gap-3">
      <Label>Pricing Strategy</Label>
      <RadioGroup value={value} onValueChange={onChange} className="flex flex-col space-y-2">
        <div className="flex items-start space-x-3 border p-3 rounded-md bg-card">
          <RadioGroupItem value="FIXED" id="r-fixed" className="mt-1" />
          <Label htmlFor="r-fixed" className="font-normal cursor-pointer">
            <div className="font-medium text-foreground">Fixed Recurring</div>
            <div className="text-muted-foreground text-sm">A flat fee billed every cycle, regardless of usage.</div>
          </Label>
        </div>
        <div className="flex items-start space-x-3 border p-3 rounded-md bg-card">
          <RadioGroupItem value="PER_USER" id="r-user" className="mt-1" />
          <Label htmlFor="r-user" className="font-normal cursor-pointer">
            <div className="font-medium text-foreground">Per Active User</div>
            <div className="text-muted-foreground text-sm">Multiplied by the number of active users/learners.</div>
          </Label>
        </div>
        <div className="flex items-start space-x-3 border p-3 rounded-md bg-card">
          <RadioGroupItem value="USAGE_BASED" id="r-usage" className="mt-1" />
          <Label htmlFor="r-usage" className="font-normal cursor-pointer">
            <div className="font-medium text-foreground">Metered Usage</div>
            <div className="text-muted-foreground text-sm">Billed post-cycle based on actual consumption (e.g. SMS credits).</div>
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
};
