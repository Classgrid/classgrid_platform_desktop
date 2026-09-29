import React, { useState } from "react";
import { useMyAiBalance, useMyAiHistory } from "@/components/ai/queries/useAiCredits";
import { formatNumber } from "@/lib/utils";
import { Wallet, Search, Calendar as CalendarIcon, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/marketing_ui/skeleton";
import { Progress } from "@/components/marketing_ui/progress";
import { Input } from "@/components/marketing_ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/marketing_ui/table";
import { NikhilTimeCalendar } from "@/components/marketing_ui/nikhil_time_calendar";
import { format } from "date-fns";

export function AiCreditsPanel() {
  const { data: balance, isLoading: balanceLoading } = useMyAiBalance();
  const { data: history, isLoading: historyLoading } = useMyAiHistory();
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  if (balanceLoading) {
    return <div className="p-8 space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" /></div>;
  }

  const isBlocked = balance?.ai_access_blocked;
  
  // Calculate usage
  const totalLimit = balance?.free_weekly_limit || 0;
  const consumed = balance?.tokens_consumed_this_week || 0;
  const remaining = Math.max(0, totalLimit - consumed);
  const usagePercent = totalLimit > 0 ? (consumed / totalLimit) * 100 : 0;
  
  const purchasedCredits = balance?.ai_credits_balance || 0;

  // Filter history
  const filteredHistory = history?.filter((txn: any) => {
    let match = true;
    if (searchTerm) {
      match = txn.type.toLowerCase().includes(searchTerm.toLowerCase()) || 
              txn.status.toLowerCase().includes(searchTerm.toLowerCase());
    }
    if (dateFilter && match) {
      match = format(new Date(txn.createdAt), "yyyy-MM-dd") === dateFilter;
    }
    return match;
  });

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

        {/* Credit Usage Progress */}
        <div className="w-full flex items-start justify-between bg-card border border-border rounded-xl p-6 shadow-sm mb-6">
            <div className="flex flex-col gap-1 pr-6 min-w-[150px]">
                <span className="text-sm font-medium text-foreground">
                    Weekly Usage Limit
                </span>
                <span className="text-xs text-muted-foreground">
                    Resets every Sunday
                </span>
                <div className="mt-2 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{formatNumber(consumed)}</span> / {formatNumber(totalLimit)} tokens
                </div>
            </div>
            
            <div className="flex-1 flex items-center gap-4 mt-1">
                <div className="flex-1 h-1.5 bg-muted-foreground/20 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-blue-500 rounded-full transition-all duration-500"
                        style={{ width: `${usagePercent}%` }}
                    />
                </div>
                <span className="text-xs text-muted-foreground w-[60px] text-right">
                    {Math.round(usagePercent)}% used
                </span>
            </div>
        </div>

        {/* Balances */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-muted/30 border border-border rounded-xl p-5 flex flex-col items-start justify-center">
            <div className="text-sm font-medium text-muted-foreground">Purchased Credits</div>
            <div className="text-3xl font-bold text-foreground mt-1">{formatNumber(purchasedCredits)}</div>
            <div className="text-xs text-muted-foreground mt-1">Never expires</div>
          </div>
          <div className="bg-muted/30 border border-border rounded-xl p-5 flex flex-col items-start justify-center">
            <div className="text-sm font-medium text-muted-foreground">Free Weekly Limit</div>
            <div className="text-3xl font-bold text-foreground mt-1">{formatNumber(totalLimit)}</div>
            <div className="text-xs text-muted-foreground mt-1">Resets every Sunday</div>
          </div>
        </div>

        {/* Transaction History Table */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <h3 className="text-lg font-semibold">Billing History</h3>
            
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  placeholder="Search payments..." 
                  className="pl-9 h-9 w-[200px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="shrink-0 w-[150px]">
                <NikhilTimeCalendar 
                  date={dateFilter}
                  setDate={setDateFilter}
                  placeholder="Select Date"
                />
              </div>
            </div>
          </div>

          <div className="border border-border rounded-xl overflow-hidden bg-card shadow-sm">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Credits Added</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="p-4"><Skeleton className="h-10 w-full" /></TableCell>
                    </TableRow>
                  ) : filteredHistory?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No transactions found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredHistory?.map((txn: any) => (
                      <TableRow key={txn._id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(txn.createdAt), "MMM dd, yyyy h:mm a")}
                        </TableCell>
                        <TableCell className="font-medium">
                          {txn.type === "topup" ? "Top-Up" : "Adjustment"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {txn.amount_inr ? `₹${formatNumber(txn.amount_inr)}` : "-"}
                        </TableCell>
                        <TableCell className="font-bold text-foreground">
                          +{formatNumber(txn.credits_added)}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            txn.status === 'success' ? 'bg-emerald-500/10 text-emerald-600' : 
                            txn.status === 'pending' ? 'bg-amber-500/10 text-amber-600' : 
                            'bg-red-500/10 text-red-600'
                          }`}>
                            {txn.status || 'unknown'}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
