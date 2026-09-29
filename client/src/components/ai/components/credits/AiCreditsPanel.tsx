import React, { useState } from "react";
import { useMyAiBalance, useMyAiHistory } from "@/components/ai/queries/useAiCredits";
import { formatNumber, cn } from "@/lib/utils";
import { Wallet, Search, Calendar as CalendarIcon, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/marketing_ui/skeleton";
import { Progress } from "@/components/marketing_ui/progress";
import { Input } from "@/components/marketing_ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/marketing_ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/marketing_ui/popover";
import { Calendar } from "@/components/marketing_ui/nikhil_calendar";
import { Button } from "@/components/marketing_ui/button";
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

        {/* AWS Style Credit Pools */}
        <div className="space-y-6 mb-6">
          {balance?.pools?.filter((p: any) => p.creditType !== "Free").map((pool: any) => {
            const issuedAmount = pool.issuedAmount || 0;
            const remainingAmount = pool.amountRemaining || 0;
            const estimatedRemaining = pool.estimatedAmountRemaining || 0;
            const usedAmount = Math.max(0, issuedAmount - remainingAmount);
            const percentUsed = issuedAmount > 0 ? (usedAmount / issuedAmount) * 100 : 0;
            
            const isFree = pool.creditType === "Free";
            const isPromo = pool.creditType === "Promotion";
            const isPaid = pool.creditType === "Paid";
            
            let typeColorClass = "text-emerald-500";
            let typeBgClass = "bg-emerald-500";
            if (isFree) {
              typeColorClass = "text-blue-500";
              typeBgClass = "bg-blue-500";
            } else if (isPromo) {
              typeColorClass = "text-purple-500";
              typeBgClass = "bg-purple-500";
            }

            return (
              <div key={pool.creditId} className="bg-card border border-border rounded-xl p-6 shadow-sm relative overflow-hidden">
                {isFree && (
                  <div className="absolute top-0 right-0 bg-blue-500/10 text-blue-500 text-xs font-bold px-3 py-1 rounded-bl-lg">
                    Free / Weekly
                  </div>
                )}
                {isPromo && (
                  <div className="absolute top-0 right-0 bg-purple-500/10 text-purple-500 text-xs font-bold px-3 py-1 rounded-bl-lg">
                    Promotion / Granted
                  </div>
                )}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-6 border-b border-border gap-4">
                  <div>
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <Wallet className={cn("w-5 h-5", typeColorClass)} />
                      Credit details <span className="text-sm font-normal text-muted-foreground ml-2">ID: {pool.creditId}</span>
                    </h3>
                  </div>
                  <div className={cn(
                    "flex items-center gap-2 text-sm px-3 py-1.5 rounded-full font-medium",
                    pool.status === "Active" 
                      ? "bg-emerald-500/10 text-emerald-600" 
                      : "bg-muted text-muted-foreground"
                  )}>
                    {pool.status === "Active" && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                    {pool.status}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-8">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Status</div>
                    <div className="font-medium text-emerald-500">{pool.status}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Start date</div>
                    <div className="font-medium">
                      {pool.startDate ? format(new Date(pool.startDate), "M/d/yyyy") : "-"}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Issued credit amount</div>
                    <div className="font-semibold text-lg">₹{formatNumber(issuedAmount / 5000)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Expiration date</div>
                    <div className="font-medium">
                      {pool.expirationDate ? format(new Date(pool.expirationDate), "M/d/yyyy") : "Never"}
                    </div>
                  </div>
                  
                  <div className="col-span-2">
                    <div className="text-sm text-muted-foreground mb-1">Amount remaining</div>
                    <div className="font-semibold text-lg">₹{formatNumber(remainingAmount / 5000)}</div>
                  </div>
                  
                  <div className="col-span-2">
                    <div className="text-sm text-muted-foreground mb-1">Estimated amount remaining</div>
                    <div className="font-semibold text-lg">₹{formatNumber(estimatedRemaining / 5000)}</div>
                  </div>
                </div>
                
                {issuedAmount > 0 && !isFree && (
                  <div className="mt-8 pt-6 border-t border-border">
                    <div className="flex justify-between text-sm mb-3">
                      <div className="flex gap-4">
                        <span className="text-muted-foreground">Amount Used: <strong className="text-foreground">₹{formatNumber(usedAmount / 5000)}</strong></span>
                        <span className="text-muted-foreground">Amount Remaining: <strong className="text-foreground">₹{formatNumber(remainingAmount / 5000)}</strong></span>
                      </div>
                      <span className="font-medium text-muted-foreground">{Math.round(percentUsed)}% Used</span>
                    </div>
                    <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={cn("h-full rounded-full transition-all duration-500", typeBgClass)}
                        style={{ width: `${percentUsed}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
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
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal h-9">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFilter ? format(new Date(dateFilter), "MMM dd, yyyy") : <span>Select Date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={dateFilter ? new Date(dateFilter) : undefined}
                      onSelect={(d: any) => setDateFilter(d ? d.toISOString() : "")}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
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
