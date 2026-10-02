import React, { useState } from "react";
import { Button } from "@/components/marketing_ui/button";
import { DangerConfirmDialog } from "@/components/marketing_ui/danger-confirm-dialog";
import { BlueSlider } from "@/components/marketing_ui/BlueSlider";
import { toast } from "sonner";
import { useUpdateOrgAiLimits } from "@/features/superadmin/queries/useAiUsage";

export interface EditOrganizationDailyLimitProps {
  orgId: string;
  orgName: string;
  currentPoolLimit: number;
  currentUserWeeklyLimit: number;
}

export function EditOrganizationDailyLimit({ orgId, orgName, currentPoolLimit, currentUserWeeklyLimit }: EditOrganizationDailyLimitProps) {
  const [open, setOpen] = useState(false);
  const [newLimit, setNewLimit] = useState(currentPoolLimit || 500000);
  const [userWeeklyLimit, setUserWeeklyLimit] = useState(currentUserWeeklyLimit || 100000);
  
  const updateLimitsMutation = useUpdateOrgAiLimits();

  const oldLimit = currentPoolLimit || 500000;
  
  // Calculate percentage change
  const percentageChange = oldLimit > 0 ? ((newLimit - oldLimit) / oldLimit) * 100 : 0;
  const isIncrease = newLimit > oldLimit;
  const isDecrease = newLimit < oldLimit;

  const handleConfirm = () => {
    updateLimitsMutation.mutate({ 
      orgId, 
      data: { pro_pool_limit: newLimit, free_weekly_limit_per_user: userWeeklyLimit } 
    }, {
      onSuccess: () => {
        toast.success(`Limits for ${orgName} updated successfully.`);
        setOpen(false);
      }
    });
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  return (
    <>
      <div className="border border-border rounded-xl overflow-hidden mt-2 shadow-sm h-full flex flex-col">
        <div className="p-6 bg-card flex flex-col gap-6 flex-1">
          <div className="flex flex-col gap-1.5">
            <h3 className="text-lg font-semibold text-foreground tracking-tight">
              Manage Organization Limits
            </h3>
            <p className="text-sm text-muted-foreground">
              Visually increase or decrease the AI token limits for {orgName}.
            </p>
          </div>
        </div>

        <div className="p-4 bg-muted/20 border-t border-border flex items-center justify-end mt-auto">
          <Button variant="outline" onClick={() => setOpen(true)}>
            Edit Limits
          </Button>
        </div>
      </div>

      <DangerConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`Edit Limits: ${orgName}`}
        description="Adjust the AI token limits. This takes effect immediately."
        warningMessage="Large increases could impact your overall billing."
        actionLabel="Save Limits"
        cancelLabel="Cancel"
        isLoading={updateLimitsMutation.isPending}
        onConfirm={handleConfirm}
        variant="warning"
      >
        <div className="flex flex-col gap-6 pt-4">
          <div className="flex flex-col gap-4 p-4 border border-border/50 rounded-lg bg-muted/30">
            <h4 className="text-sm font-semibold text-foreground">Monthly Pro Pool (Organization Wide)</h4>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Old Limit</span>
              <span className="font-semibold">{formatNumber(oldLimit)} tokens</span>
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-border/50">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">New Limit</span>
                <span className="font-bold text-lg text-blue-600 dark:text-blue-400">
                  {formatNumber(newLimit)} tokens
                </span>
              </div>
              
              <BlueSlider
                min={5000}
                max={100000000} // 10 Crore
                step={5000}
                value={newLimit}
                onValueChange={setNewLimit}
                disabled={updateLimitsMutation.isPending}
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>5K</span>
                <span>10 Cr</span>
              </div>
            </div>

            {percentageChange !== 0 && (
              <div className={`mt-2 text-sm font-medium flex items-center justify-between p-2 rounded-md ${isIncrease ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
                <span>Difference:</span>
                <span>
                  {isIncrease ? "+" : ""}{percentageChange.toFixed(1)}% {isIncrease ? "Increase" : "Decrease"}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4 p-4 border border-border/50 rounded-lg bg-muted/30">
             <h4 className="text-sm font-semibold text-foreground">Free 7-Day Limit (Per User)</h4>
             <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Weekly Limit</span>
                <span className="font-bold text-lg text-blue-600 dark:text-blue-400">
                  {formatNumber(userWeeklyLimit)} tokens
                </span>
              </div>
              <BlueSlider
                min={10000}
                max={5000000} 
                step={10000}
                value={userWeeklyLimit}
                onValueChange={setUserWeeklyLimit}
                disabled={updateLimitsMutation.isPending}
              />
          </div>
        </div>
      </DangerConfirmDialog>
    </>
  );
}
