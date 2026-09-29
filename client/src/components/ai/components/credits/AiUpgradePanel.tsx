import React, { useState } from "react";
import { useMyAiBalance, useInitiateAiTopUp } from "@/components/ai/queries/useAiCredits";
import { formatNumber } from "@/lib/utils";
import { Zap, ArrowUpCircle, Wallet, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/marketing_ui/skeleton";
import { Button } from "@/components/marketing_ui/button";
import { Input } from "@/components/marketing_ui/input";
import { toast } from "sonner";

export function AiUpgradePanel() {
  const { data: balance, isLoading: balanceLoading } = useMyAiBalance();
  const topUpMutation = useInitiateAiTopUp();

  const [customAmountStr, setCustomAmountStr] = useState<string>("100");
  
  const customAmount = parseInt(customAmountStr) || 0;
  const expectedTokens = customAmount * 5000;
  const isValidAmount = customAmount >= 100 && customAmount <= 10000;

  const handleTopUp = async () => {
    if (!isValidAmount) return;
    try {
      const response = await topUpMutation.mutateAsync(customAmount);
      if (response && response.checkout_url) {
        window.location.href = response.checkout_url;
      }
    } catch (error) {
      toast.error("Failed to initiate top-up. Please try again.");
    }
  };

  if (balanceLoading) {
    return <div className="p-8 space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" /></div>;
  }

  const isBlocked = balance?.ai_access_blocked;

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      <div className="p-6 border-b border-border">
        <h2 className="text-2xl font-bold mb-2">Upgrade AI Credits</h2>
        <p className="text-muted-foreground text-sm">Purchase additional AI Credits to continue using the assistant seamlessly.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
        {isBlocked ? (
          <div className="bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-400 p-4 rounded-lg flex items-start gap-3 border border-red-200 dark:border-red-900/50">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm">AI Access Blocked</h4>
              <p className="text-sm mt-1">Your AI access has been suspended by the administrator. Top-ups are currently disabled.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Balance Overview Mini */}
            <div className="bg-muted/30 border border-border rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-500/10 p-2 rounded-lg">
                  <Wallet className="w-5 h-5 text-indigo-500" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Current Balance</div>
                  <div className="font-bold text-foreground">{formatNumber(balance?.ai_credits_balance || 0)} Credits</div>
                </div>
              </div>
            </div>

            {/* Top-up Form */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <ArrowUpCircle className="w-5 h-5 text-amber-500" />
                Custom Top-Up Amount
              </h3>
              
              <div className="bg-card border border-border rounded-xl p-6 shadow-sm mb-6">
                <label className="block text-sm font-medium text-foreground mb-3">
                  Enter Amount (₹100 - ₹10,000)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-lg z-10">₹</span>
                  <Input 
                    type="number"
                    min={100}
                    max={10000}
                    value={customAmountStr}
                    onChange={(e) => setCustomAmountStr(e.target.value)}
                    className="w-full h-14 pl-9 pr-4 text-xl font-bold rounded-lg"
                  />
                </div>
                
                <div className="mt-6 p-4 bg-muted border border-border rounded-lg flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">You will receive:</span>
                  <span className="text-lg font-bold text-foreground flex items-center gap-1.5">
                    <Wallet className="w-5 h-5 text-muted-foreground" />
                    {formatNumber(expectedTokens)} Credits
                  </span>
                </div>
                {!isValidAmount && customAmountStr !== "" && (
                  <p className="text-red-500 text-sm mt-3 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" /> Amount must be between ₹100 and ₹10,000.
                  </p>
                )}
              </div>

              <div className="flex justify-end pt-4 mt-2">
                <Button 
                  variant="ghost"
                  onClick={handleTopUp} 
                  disabled={!isValidAmount || topUpMutation.isPending}
                  className="w-full text-muted-foreground hover:text-foreground"
                >
                  {topUpMutation.isPending ? "Processing..." : "Purchase Credits"}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
