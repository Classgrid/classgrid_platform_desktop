import React from "react";
import { useMyAiBalance, useMyAiHistory } from "@/features/chat/hooks/useAiCredits";
import { formatNumber } from "@/lib/utils";
import { Zap, Wallet, Calendar, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/marketing_ui/skeleton";
import { toast } from "sonner";
import { format } from "date-fns";


export function AiCreditsPanel() {
  const { data: balance, isLoading: balanceLoading } = useMyAiBalance();
  const { data: history, isLoading: historyLoading } = useMyAiHistory();

  if (balanceLoading) {
    return <div className="p-8 space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" /></div>;
  }

  const isBlocked = balance?.ai_access_blocked;

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      <div className="p-6 border-b border-border">
        <h2 className="text-2xl font-bold mb-2">AI Credits</h2>
        <p className="text-muted-foreground text-sm">Manage your token balance and top-up your account.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
        {isBlocked && (
          <div className="bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-400 p-4 rounded-lg flex items-start gap-3 border border-red-200 dark:border-red-900/50">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm">AI Access Blocked</h4>
              <p className="text-sm mt-1">Your AI access has been suspended by the administrator. Top-ups are disabled.</p>
            </div>
          </div>
        )}

        {/* Balance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl p-5 flex flex-col items-center text-center">
            <Wallet className="w-8 h-8 text-indigo-500 mb-3" />
            <div className="text-sm font-medium text-muted-foreground">Purchased Credits</div>
            <div className="text-3xl font-bold text-foreground mt-1">{formatNumber(balance?.ai_credits_balance || 0)}</div>
            <div className="text-xs text-muted-foreground mt-1">Never expires</div>
          </div>
          <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-xl p-5 flex flex-col items-center text-center">
            <Zap className="w-8 h-8 text-emerald-500 mb-3" />
            <div className="text-sm font-medium text-muted-foreground">Free Weekly Limit</div>
            <div className="text-3xl font-bold text-foreground mt-1">{formatNumber(balance?.free_weekly_limit || 0)}</div>
            <div className="text-xs text-muted-foreground mt-1">Resets every Sunday</div>
          </div>
        </div>


        {/* Transaction History */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            Transaction History
          </h3>
          {historyLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : history?.length === 0 ? (
            <div className="text-center py-8 bg-muted/30 rounded-lg border border-dashed border-border text-muted-foreground text-sm">
              No transactions found.
            </div>
          ) : (
            <div className="space-y-3">
              {history?.map((txn: any) => (
                <div key={txn._id} className="flex items-center justify-between p-4 bg-card border border-border rounded-lg shadow-sm">
                  <div>
                    <div className="font-medium">
                      {txn.type === "topup" ? `Top-Up (₹${txn.amount_inr})` : "Credit Adjustment"}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {format(new Date(txn.createdAt), "MMM dd, yyyy h:mm a")} • {txn.status}
                    </div>
                  </div>
                  <div className={`font-bold ${txn.type === "topup" ? "text-emerald-600" : "text-blue-600"}`}>
                    +{formatNumber(txn.credits_added)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
