import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/marketing_ui/card";
import { Button } from "@/components/marketing_ui/button";
import { ShieldAlert, RotateCcw, AlertTriangle, Plus, Coins, Zap } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { useBlockAiUser, useGrantAiCredits, useBlockAiOrg } from "../../queries/useAiUsage";
import { DangerConfirmDialog } from "@/components/marketing_ui/danger-confirm-dialog";
import { Input } from "@/components/marketing_ui/input";

export function AiUserDetailPanel({ userDetail }: { userDetail: any }) {
  const blockUserMutation = useBlockAiUser();
  const grantCreditsMutation = useGrantAiCredits();
  
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [showGrantConfirm, setShowGrantConfirm] = useState(false);
  const [grantAmount, setGrantAmount] = useState(10000);

  if (!userDetail) return null;

  const isBlocked = userDetail.ai_tokens?.ai_access_blocked;

  const handleToggleBlock = () => {
    blockUserMutation.mutate({ userId: userDetail._id, blocked: !isBlocked });
    setShowBlockConfirm(false);
  };

  const handleGrantCredits = () => {
    grantCreditsMutation.mutate({ userId: userDetail._id, amount: grantAmount });
    setShowGrantConfirm(false);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Overview Card */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Usage Overview</CardTitle>
          <CardDescription>Lifetime token consumption & balance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/30 p-4 rounded-lg border border-border/50">
              <div className="text-sm text-muted-foreground mb-1">Total Tokens Consumed</div>
              <div className="text-2xl font-bold text-blue-600">{formatNumber(userDetail.ai_tokens?.ai_tokens_consumed || 0)}</div>
            </div>
            <div className="bg-muted/30 p-4 rounded-lg border border-border/50">
              <div className="text-sm text-muted-foreground mb-1">Available Credits</div>
              <div className="text-2xl font-bold text-emerald-600">{formatNumber(userDetail.ai_tokens?.ai_credits_balance || 0)}</div>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <h4 className="font-semibold text-sm">Administrative Actions</h4>
            <div className="flex flex-wrap gap-3">
              <Button 
                variant={isBlocked ? "outline" : "destructive"}
                onClick={() => setShowBlockConfirm(true)}
                disabled={blockUserMutation.isPending}
              >
                <ShieldAlert className="w-4 h-4 mr-2" />
                {isBlocked ? "Unblock AI Access" : "Block AI Access"}
              </Button>

              <Button 
                variant="outline" 
                onClick={() => setShowGrantConfirm(true)}
                className="bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100"
              >
                <Coins className="w-4 h-4 mr-2" />
                Grant Free Credits
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">User ID</div>
            <div className="font-mono text-sm mt-1">{userDetail._id}</div>
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
            <div className="text-sm font-medium mt-1 capitalize">{userDetail.role}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Status</div>
            <div className="mt-1">
              {isBlocked ? (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  <AlertTriangle className="w-3 h-3 mr-1" /> Blocked
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <Zap className="w-3 h-3 mr-1" /> Active
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <DangerConfirmDialog
        open={showBlockConfirm}
        onOpenChange={setShowBlockConfirm}
        title={isBlocked ? "Unblock AI Access?" : "Block AI Access?"}
        description={isBlocked 
          ? "This user will immediately regain access to AI features." 
          : "This user will be immediately blocked from using any AI features. This overrides organization-level settings."}
        onConfirm={handleToggleBlock}
        confirmText={isBlocked ? "Unblock User" : "Block User"}
      />

      {/* Grant Credits Dialog */}
      {showGrantConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md shadow-lg border-2 border-amber-200">
            <CardHeader className="bg-amber-50">
              <CardTitle className="text-amber-900">Grant AI Credits</CardTitle>
              <CardDescription className="text-amber-700">Add free promotional credits directly to this user's balance.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div>
                <label className="text-sm font-medium">Amount to Grant</label>
                <Input 
                  type="number" 
                  value={grantAmount} 
                  onChange={(e) => setGrantAmount(Number(e.target.value))}
                  min={1}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Recommended: 10,000 for standard testing. These credits bypass weekly limits.
                </p>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="ghost" onClick={() => setShowGrantConfirm(false)}>Cancel</Button>
                <Button 
                  onClick={handleGrantCredits} 
                  disabled={grantCreditsMutation.isPending || grantAmount <= 0}
                  className="bg-amber-500 hover:bg-amber-600 text-white"
                >
                  {grantCreditsMutation.isPending ? "Granting..." : "Grant Credits"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
