import React, { useState } from "react";
import { useMyAiBalance, useInitiateAiTopUp } from "@/features/chat/hooks/useAiCredits";
import { formatNumber } from "@/lib/utils";
import { Zap, ArrowUpCircle, Wallet, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/marketing_ui/skeleton";
import { Button } from "@/components/marketing_ui/button";
import { toast } from "sonner";

const PACKAGES = [
  { amount: 100, tokens: 500000, label: "Starter" },
  { amount: 500, tokens: 2500000, label: "Pro" },
  { amount: 2000, tokens: 10000000, label: "Power" },
  { amount: 10000, tokens: 50000000, label: "Enterprise" },
];

export function AiUpgradePanel() {
  const { data: balance, isLoading: balanceLoading } = useMyAiBalance();
  const topUpMutation = useInitiateAiTopUp();

  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);

  const handleTopUp = async () => {
    if (!selectedAmount) return;
    try {
      const response = await topUpMutation.mutateAsync(selectedAmount);
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
        <p className="text-muted-foreground text-sm">Purchase additional AI tokens to continue using the assistant seamlessly.</p>
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
                  <div className="font-bold text-foreground">{formatNumber(balance?.ai_credits_balance || 0)} tokens</div>
                </div>
              </div>
            </div>

            {/* Top-up Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <ArrowUpCircle className="w-5 h-5 text-amber-500" />
                Select Package
              </h3>
              <div className="grid grid-cols-2 gap-4 mb-6">
                {PACKAGES.map((pkg) => (
                  <button
                    key={pkg.amount}
                    onClick={() => setSelectedAmount(pkg.amount)}
                    className={`relative p-5 rounded-xl border-2 transition-all duration-200 text-center flex flex-col items-center justify-center shadow-sm ${
                      selectedAmount === pkg.amount 
                        ? "border-amber-500 bg-amber-500/5 shadow-amber-500/10" 
                        : "border-border hover:border-amber-500/30 hover:bg-muted"
                    }`}
                  >
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">{pkg.label}</span>
                    <span className="text-2xl font-black text-foreground">₹{pkg.amount}</span>
                    <span className="text-sm text-emerald-600 dark:text-emerald-400 mt-1.5 font-medium flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      {formatNumber(pkg.tokens)} tokens
                    </span>
                  </button>
                ))}
              </div>
              <div className="flex justify-end pt-2 border-t border-border/50">
                <Button 
                  onClick={handleTopUp} 
                  disabled={!selectedAmount || topUpMutation.isPending}
                  className="bg-amber-500 hover:bg-amber-600 text-white min-w-[200px] h-11 text-base shadow-lg shadow-amber-500/20"
                >
                  {topUpMutation.isPending ? "Processing..." : "Proceed to Checkout"}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
