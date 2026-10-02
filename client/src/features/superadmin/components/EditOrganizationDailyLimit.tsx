import React, { useState } from "react";
import { Button } from "@/components/marketing_ui/button";
import { DangerConfirmDialog } from "@/components/marketing_ui/danger-confirm-dialog";
import { BlueSlider } from "@/components/marketing_ui/BlueSlider";
import { toast } from "sonner";

export function EditOrganizationDailyLimit() {
  const [open, setOpen] = useState(false);
  const [organizationName, setOrganizationName] = useState("");
  const [newLimit, setNewLimit] = useState(500000); // Default to 5 Lakhs
  const [isPending, setIsPending] = useState(false);

  // Mock old limit for demonstration
  const oldLimit = 500000;
  
  // Calculate percentage change
  const percentageChange = ((newLimit - oldLimit) / oldLimit) * 100;
  const isIncrease = newLimit > oldLimit;
  const isDecrease = newLimit < oldLimit;

  const allComplete = organizationName.length > 0;

  const handleConfirm = () => {
    setIsPending(true);
    setTimeout(() => {
      setIsPending(false);
      toast.success("Organization daily limit has been updated successfully.");
      setOpen(false);
      setOrganizationName("");
      setNewLimit(500000);
    }, 1000);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  return (
    <>
      <div className="border border-border rounded-xl overflow-hidden mt-4 shadow-sm">
        <div className="p-6 bg-card flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <h3 className="text-lg font-semibold text-foreground tracking-tight">
              Edit Organization Daily Limit
            </h3>
            <p className="text-sm text-muted-foreground">
              Visually increase or decrease the AI token limits for a specific organization using the slider.
            </p>
          </div>
        </div>

        <div className="p-4 bg-muted/20 border-t border-border flex items-center justify-end">
          <Button variant="default" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setOpen(true)}>
            Edit Limit
          </Button>
        </div>
      </div>

      <DangerConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Edit Organization Daily Limit"
        description="Adjust the daily AI token limit. This takes effect immediately."
        warningMessage="Large increases could impact your overall billing."
        actionLabel="Save New Limit"
        cancelLabel="Cancel"
        isLoading={isPending}
        onConfirm={handleConfirm}
        variant="warning"
        isConfirmDisabled={!allComplete}
      >
        <div className="flex flex-col gap-6 pt-4">
          <div className="flex flex-col gap-2.5">
            <label className="text-sm text-foreground/80 font-medium">Organization Name</label>
            <input
              type="text"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              placeholder="e.g. Classgrid Demo School"
              className="h-10 w-full rounded-md border bg-background dark:bg-black px-3 text-sm text-foreground outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 border-input"
              disabled={isPending}
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-4 p-4 border border-border/50 rounded-lg bg-muted/30">
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
                disabled={isPending}
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
            {percentageChange === 0 && (
              <div className="mt-2 text-sm font-medium flex items-center justify-between p-2 rounded-md bg-muted text-muted-foreground">
                <span>Difference:</span>
                <span>0% (Unchanged)</span>
              </div>
            )}
          </div>
        </div>
      </DangerConfirmDialog>
    </>
  );
}
