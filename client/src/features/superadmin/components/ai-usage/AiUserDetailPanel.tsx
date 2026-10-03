import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/marketing_ui/card";
import { Button } from "@/components/marketing_ui/button";
import { AlertTriangle, Zap, LayoutTemplate } from "lucide-react";
import { formatNumber, formatRoleLabel } from "@/lib/utils";
import { AiUsageBar } from "@/components/ai/components/AiUsageBar";
import { GrantCreditsModal } from "../../components/GrantCredits";
import { DataTable } from "@/components/marketing_ui/data-table";
import { BlockUserAiUsage } from "../BlockUserAiUsage";
import { ResetUserDailyLimit } from "../ResetUserDailyLimit";

export function AiUserDetailPanel({ userDetail }: { userDetail: any }) {
  const [isGrantCreditsOpen, setIsGrantCreditsOpen] = useState(false);

  if (!userDetail) return null;

  const isBlocked = userDetail.isBlocked;

  const aiBarData = {
    type: 'pro',
    used: userDetail.totalUsage || 0,
    limit: userDetail.ai_tokens?.ai_credits_balance || 0, 
    remaining: userDetail.balance || 0,
    freeData: {
      used: userDetail.ai_tokens?.used_this_week || 0,
      limit: userDetail.ai_tokens?.free_weekly_limit || 0,
      remaining: Math.max(0, (userDetail.ai_tokens?.free_weekly_limit || 0) - (userDetail.ai_tokens?.used_this_week || 0))
    }
  };

  const billingColumns = [
    {
      key: "date",
      header: "Date & Time",
      width: "w-[25%]",
      render: (_: any, row: any) => <span>{new Date(row.date).toLocaleString()}</span>
    },
    {
      key: "amount_inr",
      header: "Amount",
      width: "w-[25%]",
      render: (_: any, row: any) => <span>₹{row.amount_inr}</span>
    },
    {
      key: "credits_added",
      header: "Credits Bought",
      width: "w-[25%]",
      render: (_: any, row: any) => <span>{formatNumber(row.credits_added)}</span>
    },
    {
      key: "status",
      header: "Status",
      width: "w-[25%]",
      render: (_: any, row: any) => (
        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-500">
          {row.status.toUpperCase()}
        </span>
      )
    }
  ];

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      
      {/* Overview and Usage Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Usage Overview</CardTitle>
            <CardDescription>Lifetime credit consumption & balance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/30 p-4 rounded-lg border border-border/50">
                <div className="text-sm text-muted-foreground mb-1">Total Credits Consumed</div>
                <div className="text-2xl font-bold">{formatNumber(userDetail.totalUsage || 0)}</div>
              </div>
              <div className="bg-muted/30 p-4 rounded-lg border border-border/50">
                <div className="text-sm text-muted-foreground mb-1">Available Credits</div>
                <div className="text-2xl font-bold">{formatNumber(userDetail.balance || 0)}</div>
              </div>
            </div>
            
            <div className="mt-4 border-t border-border/50 pt-4 flex flex-col gap-4">
              {/* 1. Personal Limits */}
              {(() => {
                const limit = userDetail.ai_tokens?.free_weekly_limit || 0;
                const used = userDetail.ai_tokens?.used_this_week || 0;
                const percent = limit > 0 ? Math.min(100, Math.max(0, (used / limit) * 100)) : 0;
                return (
                  <div className="w-full flex items-start justify-between">
                    <div className="flex flex-col gap-1 pr-6 min-w-[150px]">
                      <span className="text-sm font-medium text-foreground">Personal Limits</span>
                      <span className="text-xs text-muted-foreground">Resets in 7 days</span>
                    </div>
                    <div className="flex-1 flex flex-col gap-1.5 mt-1">
                      <div className="w-full flex items-center justify-between text-xs mb-1">
                        <span className="font-medium text-foreground">{Math.round(percent)}% Used</span>
                        <span className="text-muted-foreground font-medium">{formatNumber(used)} / {formatNumber(limit)} Tokens</span>
                      </div>
                      <div className="w-full h-1.5 bg-muted-foreground/20 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* 2. Paid Credits */}
              {(() => {
                const limit = userDetail.ai_tokens?.total_ai_credits_purchased || 0;
                if (limit <= 0) return null;
                const remaining = userDetail.ai_tokens?.ai_credits_balance || 0;
                const used = Math.max(0, limit - remaining);
                const percent = limit > 0 ? Math.min(100, Math.max(0, (used / limit) * 100)) : 0;
                return (
                  <div className="w-full flex items-start justify-between">
                    <div className="flex flex-col gap-1 pr-6 min-w-[150px]">
                      <span className="text-sm font-medium text-foreground">Paid Credits</span>
                      <span className="text-xs text-muted-foreground">Purchased Top-Ups</span>
                    </div>
                    <div className="flex-1 flex flex-col gap-1.5 mt-1">
                      <div className="w-full flex items-center justify-between text-xs mb-1">
                        <span className="font-medium text-foreground">{Math.round(percent)}% Used</span>
                        <span className="text-muted-foreground font-medium">{formatNumber(used)} / {formatNumber(limit)} Tokens</span>
                      </div>
                      <div className="w-full h-1.5 bg-muted-foreground/20 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* 3. Granted Credits */}
              {(() => {
                const limit = userDetail.ai_tokens?.total_promotion_credits_granted || 0;
                const remaining = userDetail.ai_tokens?.promotion_credits_balance || 0;
                if (limit <= 0 && remaining <= 0) return null;
                const used = Math.max(0, limit - remaining);
                const percent = limit > 0 ? Math.min(100, Math.max(0, (used / limit) * 100)) : 0;
                return (
                  <div className="w-full flex items-start justify-between">
                    <div className="flex flex-col gap-1 pr-6 min-w-[150px]">
                      <span className="text-sm font-medium text-foreground flex items-center gap-2">
                        Granted Credits
                        {userDetail.ai_tokens?.promotion_credits_paused && (
                          <span className="text-[10px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Paused</span>
                        )}
                      </span>
                      <span className="text-xs text-muted-foreground">Promotional limit</span>
                    </div>
                    <div className="flex-1 flex flex-col gap-1.5 mt-1">
                      <div className="w-full flex items-center justify-between text-xs mb-1">
                        <span className="font-medium text-foreground">{Math.round(percent)}% Used</span>
                        <span className="text-muted-foreground font-medium">{formatNumber(used)} / {formatNumber(limit)} Tokens</span>
                      </div>
                      <div className="w-full h-1.5 bg-muted-foreground/20 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* 4. Org Pool (Only for Admin/Owner) */}
              {(() => {
                if (userDetail.role !== 'org_admin' && userDetail.role !== 'Owner') return null;
                if (!userDetail.orgPool) return null;
                const limit = userDetail.orgPool.limit || 0;
                const used = userDetail.orgPool.used || 0;
                const percent = limit > 0 ? Math.min(100, Math.max(0, (used / limit) * 100)) : 0;
                return (
                  <div className="w-full flex items-start justify-between">
                    <div className="flex flex-col gap-1 pr-6 min-w-[150px]">
                      <span className="text-sm font-medium text-foreground">Org Pool</span>
                      <span className="text-xs text-muted-foreground">Shared Pro pool</span>
                    </div>
                    <div className="flex-1 flex flex-col gap-1.5 mt-1">
                      <div className="w-full flex items-center justify-between text-xs mb-1">
                        <span className="font-medium text-foreground">{Math.round(percent)}% Used</span>
                        <span className="text-muted-foreground font-medium">{formatNumber(used)} / {formatNumber(limit)} Tokens</span>
                      </div>
                      <div className="w-full h-1.5 bg-muted-foreground/20 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-500 rounded-full transition-all" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })()}

            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">User ID</div>
              <div className="font-mono text-sm mt-1 truncate">{userDetail.id}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Name</div>
              <div className="text-sm font-medium mt-1">{userDetail.name || "N/A"}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Email</div>
              <div className="text-sm font-medium mt-1">{userDetail.email}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Role</div>
              <div className="text-sm font-medium mt-1">{formatRoleLabel(userDetail.role)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Total Chat Sessions</div>
              <div className="text-sm font-medium mt-1">{formatNumber(userDetail.totalChats || 0)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Status</div>
              <div className="mt-1">
                {isBlocked ? (
                  <span className="inline-flex items-center text-sm font-medium text-red-500">
                    <AlertTriangle className="w-4 h-4 mr-1.5" /> Blocked
                  </span>
                ) : (
                  <span className="inline-flex items-center text-sm font-medium text-muted-foreground">
                    <Zap className="w-4 h-4 mr-1.5" /> Active
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Billing Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Summary</CardTitle>
          <CardDescription>Track payments and credits purchased</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
             <div className="bg-muted/30 p-4 rounded-lg border border-border/50">
                <div className="text-sm text-muted-foreground mb-1">Total Payments Made</div>
                <div className="text-2xl font-bold">{formatNumber(userDetail.topupHistory?.length || 0)}</div>
             </div>
             <div className="bg-muted/30 p-4 rounded-lg border border-border/50">
                <div className="text-sm text-muted-foreground mb-1">Total Credits Bought</div>
                <div className="text-2xl font-bold">{formatNumber(userDetail.topupHistory?.reduce((acc: any, t: any) => acc + (t.credits_added || 0), 0) || 0)}</div>
             </div>
             <div className="bg-muted/30 p-4 rounded-lg border border-border/50">
                <div className="text-sm text-muted-foreground mb-1">Available Credits</div>
                <div className="text-2xl font-bold">{formatNumber(userDetail.balance || 0)}</div>
             </div>
          </div>

          <DataTable 
            columns={billingColumns} 
            rows={userDetail.topupHistory || []} 
            emptyMessage="No payment history. This user hasn't made any purchases yet."
          />
        </CardContent>
      </Card>

      {/* Grant Credits Card */}
      <div className="border border-border rounded-xl shadow-sm bg-card">
        <div className="p-6 flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <h3 className="text-lg font-semibold text-foreground tracking-tight">
              Grant User Credits
            </h3>
            <p className="text-sm text-muted-foreground">
              Open the AI Hub Panel to securely grant tokens to {userDetail.name || "this user"}.
            </p>
          </div>
        </div>
        <div className="p-4 bg-muted/20 border-t border-border flex items-center justify-end">
          <Button variant="outline" onClick={() => setIsGrantCreditsOpen(true)}>
            <LayoutTemplate className="w-4 h-4 mr-2" />
            Open Grant Credits Panel
          </Button>
        </div>
      </div>

      {userDetail.ai_tokens?.total_promotion_credits_granted > 0 && (
        <div className="border border-border rounded-xl shadow-sm bg-card">
          <div className="p-6 flex flex-col gap-6">
            <div className="flex flex-col gap-1.5">
              <h3 className="text-lg font-semibold text-foreground tracking-tight text-red-500">
                Manage Granted Credits
              </h3>
              <p className="text-sm text-muted-foreground">
                Remove or pause promotional credits granted to this user. This does not affect paid credits.
              </p>
            </div>
          </div>
          <div className="p-4 bg-muted/20 border-t border-border flex items-center justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={async () => {
                const isPaused = userDetail.ai_tokens?.promotion_credits_paused;
                try {
                  const { apiClient } = await import('@/lib/apiClient');
                  const { toast } = await import('sonner');
                  await apiClient.post(`/api/super-admin/ai-usage/users/${userDetail.id}/credits/pause`, { isPaused: !isPaused });
                  toast.success(`Granted credits ${!isPaused ? 'paused' : 'unpaused'} successfully. Please refresh the page.`);
                } catch (e) {
                  console.error(e);
                }
              }}
            >
              {userDetail.ai_tokens?.promotion_credits_paused ? 'Unpause Credits' : 'Pause Credits'}
            </Button>
            <Button 
              variant="destructive"
              onClick={async () => {
                if (window.confirm("Are you sure you want to remove all remaining granted credits for this user?")) {
                  try {
                    const { apiClient } = await import('@/lib/apiClient');
                    const { toast } = await import('sonner');
                    await apiClient.post(`/api/super-admin/ai-usage/users/${userDetail.id}/credits/remove`);
                    toast.success("Granted credits removed successfully. Please refresh the page.");
                  } catch (e) {
                    console.error(e);
                  }
                }
              }}
            >
              Remove Granted Credits
            </Button>
          </div>
        </div>
      )}

      <BlockUserAiUsage userId={userDetail.id} userName={userDetail.name || userDetail.email} isBlocked={isBlocked} />
      
      <ResetUserDailyLimit userId={userDetail.id} userName={userDetail.name || userDetail.email} />

      <GrantCreditsModal 
        isOpen={isGrantCreditsOpen} 
        onClose={() => setIsGrantCreditsOpen(false)}
        orgs={[{
          id: userDetail.id,
          name: userDetail.name || "N/A",
          orgName: userDetail.orgName || "",
          email: userDetail.email,
          role: formatRoleLabel(userDetail.role),
          avatar: userDetail.profilePicture
        }]}
      />
    </div>
  );
}