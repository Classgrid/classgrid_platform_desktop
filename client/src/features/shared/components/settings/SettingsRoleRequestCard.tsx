import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ShieldCheck, Send } from "lucide-react";
import { Button } from "@/components/marketing_ui/button";
import { Input } from "@/components/marketing_ui/input";
import { ResponsiveSelect } from "@/components/marketing_ui/responsive-select";
import { useOrgRoles } from "@/features/org-admin/queries/useOrgAdminMembers";
import { useUserProfile } from "@/features/shared/queries/useUserProfile";
import { apiClient as api } from "@/lib/apiClient";

export function SettingsRoleRequestCard() {
  const qc = useQueryClient();
  const { data: profile } = useUserProfile();
  const { data: rolesData, isLoading: loadingRoles } = useOrgRoles();
  
  const [tenantCode, setTenantCode] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const roles = rolesData?.roles || [];
  const isAdmin = profile?.role === "org_admin";
  const userEmail = profile?.email || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tenantCode.trim()) {
      toast.error("Please enter the Tenant Join Code");
      return;
    }
    
    if (!selectedRole) {
      toast.error("Please select a role to request");
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post("/org/request-role", {
        email: userEmail,
        tenant_join_code: tenantCode.trim(),
        role: selectedRole
      });
      
      // If the user is an org_admin, the backend instantly assigns the role.
      if (res.data?.instant_approval) {
        toast.success(`Role added successfully!`);
        qc.invalidateQueries({ queryKey: ["currentUser"] });
        qc.invalidateQueries({ queryKey: ["userProfile"] });
      } else {
        // Normal user -> Request goes to pending
        toast.success("Role request sent to your Org Admin for approval.");
      }
      
      setTenantCode("");
      setSelectedRole("");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to process role request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 flex flex-col gap-6">
      <div className="flex flex-col gap-2 border-b border-border pb-4">
        <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          {isAdmin ? "Add a Role" : "Request a Role"}
        </h3>
        <p className="text-sm text-muted-foreground">
          {isAdmin 
            ? "Enter an email and your organization's Tenant ID to add a role."
            : "Need access to a specific dashboard? Enter your email and organization's Tenant ID to request a role."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Email Address */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Email Address</label>
            <Input
              type="email"
              className="bg-muted text-muted-foreground cursor-not-allowed"
              value={userEmail}
              disabled
              readOnly
            />
          </div>

          {/* Tenant Join Code */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Tenant ID</label>
            <Input
              type="text"
              placeholder="e.g. VHSIKZIREQM"
              className="bg-background"
              value={tenantCode}
              onChange={(e) => setTenantCode(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">Required for security verification.</p>
          </div>

          {/* Role Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Role</label>
            <ResponsiveSelect
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              disabled={loadingRoles}
              required
            >
              <option value="">Select a role...</option>
              {roles.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </ResponsiveSelect>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={isSubmitting} className="gap-2">
            {isSubmitting ? (
              <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {isAdmin ? "Add Role" : "Submit Request"}
          </Button>
        </div>
      </form>
    </div>
  );
}
