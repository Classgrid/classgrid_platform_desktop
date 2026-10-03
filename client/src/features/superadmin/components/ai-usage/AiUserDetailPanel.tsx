import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/marketing_ui/card";
import { Button } from "@/components/marketing_ui/button";
import { AlertTriangle, Zap, LayoutTemplate } from "lucide-react";
import { formatNumber, formatRoleLabel } from "@/lib/utils";
import { useBlockAiUser, useResetUserUsage, useRequestSecurityCode, useVerifySecurityCode } from "../../queries/useAiUsage";
import { DangerConfirmDialog } from "@/components/marketing_ui/danger-confirm-dialog";
import { toast } from "sonner";
import { AiUsageBar } from "@/components/ai/components/AiUsageBar";
import { DataTable } from "@/components/marketing_ui/data-table";
import { GrantCreditsModal } from "../../components/GrantCredits";

export function AiUserDetailPanel({ userDetail }: { userDetail: any }) {
  const blockUserMutation = useBlockAiUser();
  const resetUserMutation = useResetUserUsage();
  
  const requestSecurityCode = useRequestSecurityCode();
  const verifySecurityCode = useVerifySecurityCode();

  // State for Block
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [blockCode, setBlockCode] = useState("");

  // State for Reset
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetCode, setResetCode] = useState("");

  // State for Grant
  const [isGrantCreditsOpen, setIsGrantCreditsOpen] = useState(false);

  if (!userDetail) return null;

  const isBlocked = userDetail.isBlocked;

  const handleToggleBlock = async () => {
    try {
      await verifySecurityCode.mutateAsync({ code: blockCode, action: "BLOCK_USER_AI", orgId: undefined });
      blockUserMutation.mutate({ userId: userDetail.id, blocked: !isBlocked }, {
        onSuccess: () => {
          toast.success(`User AI access has been ${!isBlocked ? 'blocked' : 'unblocked'} successfully.`);
          setShowBlockConfirm(false);
          setBlockCode("");
        }
      });
    } catch (e) {
      console.error("OTP verification failed", e);
    }
  };

  const handleResetLimit = async () => {
    try {
      await verifySecurityCode.mutateAsync({ code: resetCode, action: "RESET_USER_USAGE", orgId: undefined });
      resetUserMutation.mutate(userDetail.id, {
        onSuccess: () => {
          toast.success(`Usage for user has been reset successfully.`);
          setShowResetConfirm(false);
          setResetCode("");
        }
      });
    } catch (e) {
      console.error("OTP verification failed", e);
    }
  };

  const aiBarData = {
    type: 'pro',
    used: userDetail.totalUsage || 0,
    limit: userDetail.ai_tokens?.ai_credits_balance || 0, // Fallback if no org pool
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
      render: (_: any, row: any) => <span>?{row.amount_inr}</span>
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
            
            <div className="mt-4 border-t border-border/50 pt-4">
              <AiUsageBar initialData={aiBarData} showExactTokens={true} />
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
                <div className="text-2xl font-bold">{formatNumber(userDetail.topupHistory?.reduce((acc: number, t: any) => acc + (t.credits_added || 0), 0) || 0)}</div>
             </div>
             <div className="bg-muted/30 p-4 rounded-lg border border-border/50">
                <div className="text-sm text-muted-foreground mb-1">Available Credits</div>
                <div className="text-2xl font-bold">{formatNumber(userDetail.balance || 0)}</div>
             </div>
          </div>

          <div className="rounded-md border">
             <div className="bg-muted/50 px-4 py-3 border-b text-xs font-semibold text-muted-foreground uppercase tracking-wider grid grid-cols-4">
                <div>Date & Time</div>
                <div>Amount</div>
                <div>Credits Bought</div>
                <div>Status</div>
             </div>
             <div className="divide-y max-h-[300px] overflow-y-auto">
                {userDetail.topupHistory?.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">No payment history found.</div>
                ) : (
                  userDetail.topupHistory?.map((tx: any) => (
                    <div key={tx.id} className="px-4 py-3 text-sm grid grid-cols-4 items-center hover:bg-muted/30">
                      <div>{new Date(tx.date).toLocaleString()}</div>
                      <div>₹{tx.amount_inr}</div>
                      <div>{formatNumber(tx.credits_added)}</div>
                      <div>
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-500">
                          {tx.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
             </div>
          </div>
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

      {/* Block Access Card */}
      <div className={`border rounded-xl overflow-hidden shadow-sm h-full flex flex-col ${isBlocked ? 'border-rose-500/20' : 'border-border'}`}>
        <div className={`p-6 flex flex-col gap-6 flex-1 ${isBlocked ? 'bg-rose-500/5' : 'bg-card'}`}>
          <div className="flex flex-col gap-1.5">
            <h3 className={`text-lg font-semibold tracking-tight ${isBlocked ? 'text-rose-700 dark:text-rose-400' : 'text-foreground'}`}>
              {isBlocked ? "AI Access Blocked" : "Block User AI Usage"}
            </h3>
            <p className={`text-sm ${isBlocked ? 'text-rose-600/80 dark:text-rose-400/80' : 'text-muted-foreground'}`}>
              {isBlocked 
                ? "All AI usage is suspended for this user. You can unblock them by entering your security code." 
                : "Immediately revoke all AI platform access for this user. This requires a Super Admin security code."}
            </p>
          </div>
        </div>

        <div className={`p-4 border-t flex items-center justify-end mt-auto ${isBlocked ? 'bg-rose-500/10 border-rose-500/20' : 'bg-muted/20 border-border'}`}>
          <Button 
            variant={isBlocked ? "default" : "destructive"} 
            className={isBlocked ? "bg-rose-600 hover:bg-rose-700 text-white" : ""}
            onClick={async () => {
              try {
                await requestSecurityCode.mutateAsync({ action: "BLOCK_USER_AI", orgId: undefined });
                setShowBlockConfirm(true);
              } catch (e) {
                console.error("Failed to request OTP", e);
              }
            }}
            disabled={requestSecurityCode.isPending}
          >
            {requestSecurityCode.isPending ? "Sending Code..." : (isBlocked ? "Unblock Access" : "Block Access")}
          </Button>
        </div>
      </div>

      {/* Reset Usage Card */}
      <div className="border border-border rounded-xl overflow-hidden shadow-sm h-full flex flex-col mt-2">
        <div className="p-6 bg-card flex flex-col gap-6 flex-1">
          <div className="flex flex-col gap-1.5">
            <h3 className="text-lg font-semibold text-foreground tracking-tight">
              Reset User Usage
            </h3>
            <p className="text-sm text-muted-foreground">
              Force reset the AI token consumption tracking for {userDetail.name || "this user"}. This requires a Super Admin security code.
            </p>
          </div>
        </div>

        <div className="p-4 bg-muted/20 border-t border-border flex items-center justify-end mt-auto">
          <Button 
            variant="outline" 
            onClick={async () => {
              try {
                await requestSecurityCode.mutateAsync({ action: "RESET_USER_USAGE", orgId: undefined });
                setShowResetConfirm(true);
              } catch (e) {
                console.error("Failed to request OTP", e);
              }
            }}
            disabled={requestSecurityCode.isPending}
          >
            {requestSecurityCode.isPending ? "Sending Code..." : "Reset Limit"}
          </Button>
        </div>
      </div>

      {/* Dialogs */}
      <DangerConfirmDialog
        open={showBlockConfirm}
        onOpenChange={setShowBlockConfirm}
        title={isBlocked ? `Unblock ${userDetail.name}?` : `Block ${userDetail.name}?`}
        description="Please provide your Super Admin security code to proceed."
        warningMessage={isBlocked ? undefined : "This action will instantly block all AI access for this user."}
        actionLabel={isBlocked ? "Unblock" : "Block"}
        cancelLabel="Cancel"
        isLoading={blockUserMutation.isPending}
        onConfirm={handleToggleBlock}
        variant={isBlocked ? "default" : "destructive"}
        isConfirmDisabled={blockCode.length !== 6}
      >
        <div className="flex flex-col gap-5 pt-2">
          <div className="flex flex-col gap-2.5">
            <label className="text-sm text-foreground/80">Enter code to confirm</label>
            <input
              type="password"
              value={blockCode}
              onChange={(e) => setBlockCode(e.target.value)}
              placeholder="Security Code"
              className="h-10 w-full rounded-md border bg-background dark:bg-black px-3 text-sm text-foreground outline-none transition-all duration-200 focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500/50 border-input"
              disabled={blockUserMutation.isPending}
            />
          </div>
        </div>
      </DangerConfirmDialog>

      <DangerConfirmDialog
        open={showResetConfirm}
        onOpenChange={setShowResetConfirm}
        title={`Reset ${userDetail.name} Usage`}
        description="Please provide your Super Admin security code to proceed."
        warningMessage="This action will instantly overwrite the user's token consumption tracking, resetting their weekly usage back to 0."
        actionLabel="Reset Usage"
        cancelLabel="Cancel"
        isLoading={resetUserMutation.isPending}
        onConfirm={handleResetLimit}
        variant="warning"
        isConfirmDisabled={resetCode.length !== 6}
      >
        <div className="flex flex-col gap-5 pt-2">
          <div className="flex flex-col gap-2.5">
            <label className="text-sm text-foreground/80">Enter code to reset usage</label>
            <input
              type="password"
              value={resetCode}
              onChange={(e) => setResetCode(e.target.value)}
              placeholder="Security Code"
              className="h-10 w-full rounded-md border bg-background dark:bg-black px-3 text-sm text-foreground outline-none transition-all duration-200 focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500/50 border-input"
              disabled={resetUserMutation.isPending}
            />
          </div>
        </div>
      </DangerConfirmDialog>

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