import React, { useState } from "react";
import { Button } from "@/components/marketing_ui/button";
import { DangerConfirmDialog } from "@/components/marketing_ui/danger-confirm-dialog";
import { toast } from "sonner";

export function ResetOrganizationDailyLimit() {
  const [open, setOpen] = useState(false);
  const [securityCode, setSecurityCode] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [resetAmount, setResetAmount] = useState("");
  const [isPending, setIsPending] = useState(false);

  const allComplete = securityCode.length > 0 && organizationName.length > 0 && resetAmount.length > 0;

  const handleConfirm = () => {
    setIsPending(true);
    // TODO: Connect this to the actual backend API endpoint for resetting daily limits
    setTimeout(() => {
      setIsPending(false);
      toast.success("Organization daily limit has been reset successfully.");
      setOpen(false);
      setSecurityCode("");
      setOrganizationName("");
      setResetAmount("");
    }, 1000);
  };

  return (
    <>
      <div className="border border-border rounded-xl overflow-hidden mt-2 shadow-sm">
        <div className="p-6 bg-card flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <h3 className="text-lg font-semibold text-foreground tracking-tight">
              Reset Organization Daily Limit
            </h3>
            <p className="text-sm text-muted-foreground">
              Force reset the daily AI token limits for a specific organization. This requires a Super Admin security code.
            </p>
          </div>
        </div>

        <div className="p-4 bg-muted/20 border-t border-border flex items-center justify-end">
          <Button variant="outline" onClick={() => setOpen(true)}>
            Reset Limit
          </Button>
        </div>
      </div>

      <DangerConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Reset Organization Daily Limit"
        description="Please provide the organization details and your security code to proceed."
        warningMessage="This action will instantly overwrite the organization's daily token consumption tracking."
        actionLabel="Reset Limit"
        cancelLabel="Cancel"
        isLoading={isPending}
        onConfirm={handleConfirm}
        variant="warning"
        isConfirmDisabled={!allComplete}
      >
        <div className="flex flex-col gap-5 pt-2">
          <div className="flex flex-col gap-2.5">
            <label className="text-sm text-foreground/80">Organization Name</label>
            <input
              type="text"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              placeholder="e.g. Classgrid Demo School"
              className="h-10 w-full rounded-md border bg-background dark:bg-black px-3 text-sm text-foreground outline-none transition-all duration-200 focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500/50 border-input"
              disabled={isPending}
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-2.5">
            <label className="text-sm text-foreground/80">Enter amount for resetting into before</label>
            <input
              type="number"
              value={resetAmount}
              onChange={(e) => setResetAmount(e.target.value)}
              placeholder="e.g. 0"
              className="h-10 w-full rounded-md border bg-background dark:bg-black px-3 text-sm text-foreground outline-none transition-all duration-200 focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500/50 border-input"
              disabled={isPending}
            />
          </div>

          <div className="flex flex-col gap-2.5">
            <label className="text-sm text-foreground/80">Enter code to reset limit</label>
            <input
              type="password"
              value={securityCode}
              onChange={(e) => setSecurityCode(e.target.value)}
              placeholder="Security Code"
              className="h-10 w-full rounded-md border bg-background dark:bg-black px-3 text-sm text-foreground outline-none transition-all duration-200 focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500/50 border-input"
              disabled={isPending}
            />
          </div>
        </div>
      </DangerConfirmDialog>
    </>
  );
}
