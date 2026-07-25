import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
    ArrowLeft, Printer, ShieldAlert, CheckCircle, Ban, LogOut, Key, UserCheck, Edit3 
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/marketing_ui/card";
import { Button } from "@/components/marketing_ui/button";
import { Badge } from "@/components/marketing_ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/marketing_ui/dialog";
import { ResponsiveSelect } from "@/components/marketing_ui/responsive-select";
import { apiClient } from "@/lib/apiClient";
import { formatDate } from "@/utils/dateUtils";

// ── Types ────────────────────────────────────────────────────────────────────

type Action = "ban" | "unban" | "force-logout" | "reset-password" | "change-role";

const ROLE_OPTIONS = [
  { label: "Student", value: "student" },
  { label: "Faculty", value: "faculty" },
  { label: "Org Admin", value: "org_admin" },
  { label: "Super Admin", value: "super_admin" },
  { label: "Principal", value: "principal" },
  { label: "HOD", value: "hod" },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function UserDetailPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [confirm, setConfirm] = useState<{ action: Action } | null>(null);
  const [newRole, setNewRole] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["global-user-detail", userId],
    queryFn: () => apiClient.get<{ success: boolean; data: { user: any, organization: any } }>(`/api/super-admin/users/${userId}/full`).then(r => r.data.data),
    enabled: !!userId,
  });

  const user = data?.user;
  const org = data?.organization;

  // ── Mutations ──────────────────────────────────────────────────────────────
  const banMut = useMutation({ mutationFn: () => apiClient.patch(`/api/super-admin/users/${userId}/ban`), onSuccess: () => { qc.invalidateQueries({ queryKey: ["global-user-detail"] }); toast.success("User banned."); setConfirm(null); } });
  const unbanMut = useMutation({ mutationFn: () => apiClient.patch(`/api/super-admin/users/${userId}/unban`), onSuccess: () => { qc.invalidateQueries({ queryKey: ["global-user-detail"] }); toast.success("Reactivated."); setConfirm(null); } });
  const logoutMut = useMutation({ mutationFn: () => apiClient.post(`/api/super-admin/users/${userId}/force-logout`), onSuccess: () => { toast.success("Force-logged out."); setConfirm(null); } });
  const resetMut = useMutation({ mutationFn: () => apiClient.post(`/api/super-admin/users/${userId}/reset-password`), onSuccess: () => { toast.success("Reset email sent."); setConfirm(null); } });
  const roleMut = useMutation({ mutationFn: (role: string) => apiClient.patch(`/api/super-admin/users/${userId}/role`, { role }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["global-user-detail"] }); toast.success("Role updated."); setConfirm(null); } });

  const isPending = banMut.isPending || unbanMut.isPending || logoutMut.isPending || resetMut.isPending || roleMut.isPending;

  function executeAction() {
    if (!confirm) return;
    const { action } = confirm;
    if (action === "ban") banMut.mutate();
    else if (action === "unban") unbanMut.mutate();
    else if (action === "force-logout") logoutMut.mutate();
    else if (action === "reset-password") resetMut.mutate();
    else if (action === "change-role") roleMut.mutate(newRole);
  }

  const actionLabels: Record<Action, string> = {
    ban: "Ban User", unban: "Unban User", "force-logout": "Force Logout",
    "reset-password": "Send Password Reset", "change-role": "Change Role",
  };

  // ── Dynamic Rendering Logic ────────────────────────────────────────────────
  
  const hasValue = (val: any) => val !== null && val !== undefined && val !== "";
  
  const Section = ({ title, fields }: { title: string, fields: { label: string, value: any }[] }) => {
    const validFields = fields.filter(f => hasValue(f.value));
    if (validFields.length === 0) return null;

    return (
      <div className="mb-8 break-inside-avoid">
        <h3 className="text-sm font-bold uppercase tracking-wider border-b border-border pb-2 mb-4 text-foreground/80 flex items-center gap-2">
           {title}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-5 gap-x-8 print:grid-cols-3">
          {validFields.map((f, i) => (
            <div key={i} className="flex flex-col gap-1">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                {f.label}
              </span>
              <span className="text-sm text-foreground font-medium whitespace-pre-wrap">
                {typeof f.value === "boolean" ? (f.value ? "Yes" : "No") : String(f.value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (isLoading) {
      return <div className="p-8 text-center text-muted-foreground">Loading user data...</div>;
  }

  if (!user) {
      return <div className="p-8 text-center text-muted-foreground">User not found.</div>;
  }

  const isBanned = user.status === "suspended";
  const rollLabel = org?.academic_config?.identifierLabel || org?.rollNumberLabel || "PRN";

  // Parse Metadata if present
  let metadataFields = [];
  if (user.metadata && typeof user.metadata === "object") {
      metadataFields = Object.keys(user.metadata).map(k => ({
          label: k.replace(/_/g, " "), 
          value: user.metadata[k]
      }));
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1000px] mx-auto p-4 sm:p-6 lg:p-8 pb-20 print:p-0 print:bg-white print:text-black">
      
      {/* ── Top Nav (Hidden in print) ── */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={() => navigate("/superadmin/global-users")} className="h-8 w-8">
                <ArrowLeft size={16} />
            </Button>
            <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground cursor-pointer hover:text-foreground transition-colors" onClick={() => navigate("/superadmin/global-users")}>
                    Global Users
                </span>
                <span className="text-muted-foreground">/</span>
                <span className="font-medium text-foreground">{user.name}</span>
            </div>
        </div>
        <Button onClick={() => window.print()} variant="outline" size="sm" className="gap-2 border-border shadow-sm">
            <Printer size={14} /> Print Profile
        </Button>
      </div>

      {/* ── Profile Header Card ── */}
      <Card className="border-border shadow-sm overflow-hidden bg-card print:border-none print:shadow-none">
        <div className="h-32 w-full bg-gradient-to-r from-primary/20 to-primary/5 relative print:hidden">
            {user.bannerImage && <img src={user.bannerImage} alt="banner" className="w-full h-full object-cover" />}
        </div>
        <CardContent className="p-6 pt-0 relative sm:px-8">
            <div className="flex flex-col sm:flex-row gap-6 sm:items-end -mt-12 sm:-mt-16 mb-6">
                <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-full border-4 border-card bg-muted overflow-hidden flex-shrink-0 z-10">
                    {user.profilePicture ? (
                        <img src={user.profilePicture} alt="profile" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl font-semibold text-muted-foreground bg-muted">
                            {user.name?.charAt(0)}
                        </div>
                    )}
                </div>
                <div className="flex-1 pb-2 flex flex-col gap-1 z-10 pt-12 sm:pt-0">
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
                        {user.name} 
                        {user.isEmailVerified && <CheckCircle size={20} className="text-primary" />}
                    </h1>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <span>{user.email}</span>
                        {user.phoneNumber && (
                            <>
                                <span className="hidden sm:inline">•</span>
                                <span>{user.phoneNumber}</span>
                            </>
                        )}
                        {org && (
                            <>
                                <span className="hidden sm:inline">•</span>
                                <span className="flex items-center gap-1.5 text-foreground font-medium">
                                    {org.logo_url && <img src={org.logo_url} alt="org" className="h-4 w-4 rounded" />}
                                    {org.name}
                                </span>
                            </>
                        )}
                    </div>
                </div>
                <div className="flex flex-col gap-2 pb-2 sm:items-end z-10">
                    <Badge variant={isBanned ? "danger" : "success"} dot className="w-fit">
                        {isBanned ? "Suspended" : "Active"}
                    </Badge>
                    <Badge variant="neutral" className="w-fit uppercase tracking-wider text-[10px]">
                        {user.role?.replace(/_/g, " ")}
                    </Badge>
                </div>
            </div>

            <div className="h-px w-full bg-border my-8 print:my-6" />

            {/* ── Dynamic Sections ── */}
            
            <Section title="Personal Details" fields={[
                { label: "Full Name", value: user.name },
                { label: "Email Address", value: user.email },
                { label: "Alternate Email", value: user.alternateEmail },
                { label: "Phone Number", value: user.phoneNumber },
                { label: "Date of Birth", value: user.dob ? formatDate(user.dob) : null },
                { label: "Gender", value: user.gender },
                { label: "Address", value: user.address },
                { label: "Bio / About", value: user.bio },
                { label: "Hobbies", value: user.hobby },
            ]} />

            <Section title="Parents / Guardian Info" fields={[
                { label: "Father's Name", value: user.fatherName },
                { label: "Mother's Name", value: user.motherName },
            ]} />

            <Section title="Academic Information" fields={[
                { label: rollLabel, value: user.prn },
                { label: "Branch / Program", value: user.branch },
                { label: "Batch / Year", value: user.batch },
                { label: "Department", value: user.department },
                { label: "Qualification", value: user.qualification },
                { label: "Eligibility Number", value: user.eligibilityNo },
                { label: "Exam Pattern", value: user.pattern },
                { label: "Subjects Assigned", value: user.subjectsAssigned?.join(", ") },
            ]} />

            <Section title="Admission & Compliance" fields={[
                { label: "Admission Type", value: user.admission_type },
                { label: "Category", value: user.category },
                { label: "ABC ID", value: user.abc_id },
                { label: "Anti-Ragging Undertaking No.", value: user.anti_ragging_undertaking_no },
            ]} />

            <Section title="Organization Details" fields={[
                { label: "Organization Name", value: org?.name },
                { label: "Org Type", value: org?.org_type },
                { label: "Structure Type", value: org?.structure_type },
                { label: "Subdomain", value: org?.subdomain },
            ]} />

            <Section title="HR & Payroll" fields={[
                { label: "Biometric ID", value: user.biometricId },
                { label: "Salary Mode", value: user.payroll_config?.salary_mode },
                { label: "Hourly Rate", value: user.payroll_config?.hourly_rate },
                { label: "Base Monthly Salary", value: user.payroll_config?.base_monthly_salary },
            ]} />

            <Section title="Authentication & Security" fields={[
                { label: "Authentication Provider", value: user.authProvider },
                { label: "Email Verified", value: user.isEmailVerified },
                { label: "Status", value: user.status },
                { label: "Account Locked Until", value: user.lockUntil ? formatDate(user.lockUntil) : null },
                { label: "Login Attempts", value: user.loginAttempts },
                { label: "Must Reset Password", value: user.mustResetPassword },
            ]} />

            <Section title="System Information" fields={[
                { label: "Primary Role", value: user.role },
                { label: "Additional Roles", value: user.additional_roles?.join(", ") },
                { label: "Joined At", value: formatDate(user.createdAt) },
                { label: "Last Updated", value: formatDate(user.updatedAt) },
                { label: "Last Login At", value: user.lastLoginAt ? formatDate(user.lastLoginAt) : null },
                { label: "Is Sandbox Account", value: user.isSandbox },
                { label: "Is Demo User", value: user.is_demo },
            ]} />

            {metadataFields.length > 0 && (
                <Section title="Additional Metadata" fields={metadataFields} />
            )}

            {user.trustedDevices?.length > 0 && (
                <div className="mb-6 break-inside-avoid">
                    <h3 className="text-sm font-bold uppercase tracking-wider border-b border-border pb-2 mb-4 text-foreground/80">Trusted Devices</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {user.trustedDevices.map((device: any, i: number) => (
                            <div key={i} className="p-3 border border-border rounded bg-muted/20 text-xs flex flex-col gap-1">
                                <span className="font-semibold text-foreground">{device.browser} on {device.os}</span>
                                <span className="text-muted-foreground font-mono truncate">IP Hash: {device.ipHash}</span>
                                <span className="text-muted-foreground">Added: {formatDate(device.addedAt)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

        </CardContent>
      </Card>

      {/* ── Admin Actions (Hidden in print) ── */}
      <div className="print:hidden mt-8">
        <h3 className="text-lg font-bold text-foreground mb-4">Super Admin Actions</h3>
        <div className="flex flex-wrap items-center gap-3">
            {isBanned 
                ? <Button variant="outline" onClick={() => setConfirm({ action: "unban" })} className="gap-2 border-success/20 text-success hover:bg-success/10"><UserCheck size={16} /> Reactivate Account</Button>
                : <Button variant="destructive" onClick={() => setConfirm({ action: "ban" })} className="gap-2"><Ban size={16} /> Suspend Account</Button>
            }
            <Button variant="outline" onClick={() => setConfirm({ action: "force-logout" })} className="gap-2 border-border"><LogOut size={16} /> Force Logout</Button>
            <Button variant="outline" onClick={() => setConfirm({ action: "reset-password" })} className="gap-2 border-border"><Key size={16} /> Send Password Reset</Button>
            <Button variant="outline" onClick={() => { setNewRole(user.role); setConfirm({ action: "change-role" }); }} className="gap-2 border-border"><Edit3 size={16} /> Change Role</Button>
        </div>
      </div>

      {/* ── Confirm Dialog ── */}
      <Dialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{confirm ? actionLabels[confirm.action] : ""}</DialogTitle>
            <DialogDescription>
              {confirm?.action === "change-role"
                ? `Update role for ${user.name}`
                : `Are you sure you want to perform "${confirm ? actionLabels[confirm.action] : ""}" on ${user.name}?`}
            </DialogDescription>
          </DialogHeader>
          {confirm?.action === "change-role" && (
            <div className="py-4">
               <label className="text-sm font-medium mb-2 block">New Role</label>
               <ResponsiveSelect
                    className="w-full h-10 rounded-md border border-input bg-background px-3"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                >
                    <option value="" disabled>Select a role...</option>
                    {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </ResponsiveSelect>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirm(null)}>Cancel</Button>
            <Button
              variant={confirm?.action === "ban" ? "destructive" : "default"}
              isLoading={isPending}
              onClick={executeAction}
              disabled={confirm?.action === "change-role" && !newRole}
            >Confirm Action</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
