import React, { useState } from "react";
import { Button } from "@/components/marketing_ui/button";
import { DangerConfirmDialog } from "@/components/marketing_ui/danger-confirm-dialog";
import { BlueSlider } from "@/components/marketing_ui/BlueSlider";
import { toast } from "sonner";
import { useResetOrgUsage } from "@/features/superadmin/queries/useAiUsage";

export interface ResetOrganizationDailyLimitProps {
  orgId: string;
  orgName: string;
}

export function ResetOrganizationDailyLimit({ orgId, orgName }: ResetOrganizationDailyLimitProps) {
  const [open, setOpen] = useState(false);
  const [securityCode, setSecurityCode] = useState("");
  const [resetAmount, setResetAmount] = useState(5000);
  
  const resetMutation = useResetOrgUsage();

  const allComplete = securityCode.length > 0 && resetAmount !== null;

  const handleConfirm = () => {
    resetMutation.mutate(orgId, {
      onSuccess: () => {
        toast.success(`Usage for ${orgName} has been reset successfully.`);
        setOpen(false);
        setSecurityCode("");
        setResetAmount(5000);
      }
    });
  };

  return (
    <>
      <div className="border border-border rounded-xl overflow-hidden mt-2 shadow-sm h-full flex flex-col">
        <div className="p-6 bg-card flex flex-col gap-6 flex-1">
          <div className="flex flex-col gap-1.5">
            <h3 className="text-lg font-semibold text-foreground tracking-tight">
              Reset Organization Usage
            </h3>
            <p className="text-sm text-muted-foreground">
              Force reset the AI token consumption tracking for {orgName}. This requires a Super Admin security code.
            </p>
          </div>
        </div>

        <div className="p-4 bg-muted/20 border-t border-border flex items-center justify-end mt-auto">
          <Button variant="outline" onClick={() => setOpen(true)}>
            Reset Limit
          </Button>
        </div>
      </div>

      <DangerConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`Reset ${orgName} Usage`}
        description="Please provide your security code and the target limit to proceed."
        warningMessage="This action will instantly overwrite the organization's token consumption tracking."
        actionLabel="Reset Limit"
        cancelLabel="Cancel"
        isLoading={resetMutation.isPending}
        onConfirm={handleConfirm}
        variant="warning"
        isConfirmDisabled={!allComplete}
      >
        <div className="flex flex-col gap-5 pt-2">
          <div className="flex flex-col gap-2.5">
            <div className="flex justify-between items-center">
              <label className="text-sm text-foreground/80">Enter amount for resetting into before</label>
              <span className="font-bold text-amber-600 dark:text-amber-500">
                {new Intl.NumberFormat('en-IN').format(resetAmount)} tokens
              </span>
            </div>
            <div className="pt-2">
              <BlueSlider
                min={5000}
                max={100000000} // 10 Crore
                step={5000}
                value={resetAmount}
                onValueChange={setResetAmount}
                disabled={resetMutation.isPending}
                className="accent-amber-600 hover:accent-amber-700" 
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>5K</span>
                <span>10 Cr</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <label className="text-sm text-foreground/80">Enter code to reset limit</label>
            <input
              type="password"
              value={securityCode}
              onChange={(e) => setSecurityCode(e.target.value)}
              placeholder="Security Code"
              className="h-10 w-full rounded-md border bg-background dark:bg-black px-3 text-sm text-foreground outline-none transition-all duration-200 focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500/50 border-input"
              disabled={resetMutation.isPending}
            />
          </div>
        </div>
      </DangerConfirmDialog>
    </>
  );
}
