import React, { useState } from "react";
import { User, Globe } from "lucide-react";
import { Button } from "@/components/marketing_ui/button";
import { Spinner } from "@/components/marketing_ui/spinner";
import { NikhilTimeCalendar } from "@/components/marketing_ui/nikhil_time_calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { apiClient } from "@/lib/apiClient";

export function SuperAdminProfileView({ profileData }: { profileData: any }) {
  const [formData, setFormData] = useState<Record<string, any>>({
    ...(profileData || {}),
    ...(profileData?.metadata || {})
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    if (profileData) {
      const nameParts = (profileData.name || "").trim().split(/\s+/);
      setFormData(prev => ({
        ...prev,
        ...profileData,
        ...(profileData.metadata || {}),
        "identity.first_name": profileData.metadata?.["identity.first_name"] || nameParts[0] || "",
        "identity.last_name": profileData.metadata?.["identity.last_name"] || nameParts.slice(1).join(" ") || "",
      }));
    }
  }, [profileData]);

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const firstName = (formData["identity.first_name"] || "").trim();
      const lastName = (formData["identity.last_name"] || "").trim();
      const fullName = [firstName, lastName].filter(Boolean).join(" ");

      await apiClient.put("/api/user/update", {
        name: fullName || undefined,
        dob: formData["identity.date_of_birth"] || null,
        bio: formData["social.bio"] || formData.bio || "",
        hobby: formData["social.hobby"] || formData.hobby || "",
        metadata: {
          "identity.first_name": firstName,
          "identity.last_name": lastName,
          "identity.date_of_birth": formData["identity.date_of_birth"] || "",
          "social.bio": formData["social.bio"] || formData.bio || "",
          "social.hobby": formData["social.hobby"] || formData.hobby || "",
          "social.tech_stack": formData["social.tech_stack"] || "",
          "social.linkedin": formData["social.linkedin"] || "",
          "social.github": formData["social.github"] || "",
          "social.twitter": formData["social.twitter"] || "",
          "social.coding_profile": formData["social.coding_profile"] || "",
          "social.portfolio": formData["social.portfolio"] || "",
          "social.instagram": formData["social.instagram"] || "",
          "social.facebook": formData["social.facebook"] || "",
        }
      });
      toast.success("Super Admin profile updated successfully");
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  };

  const dobValue = formData["identity.date_of_birth"] || formData.dob || "";
  const dobDate = dobValue ? new Date(dobValue) : undefined;

  return (
    <div className="flex flex-col gap-6 w-full max-w-3xl mx-auto">
      <div className="border rounded-xl bg-card shadow-sm overflow-hidden mt-2">
        <div className="border-b bg-muted/10 px-6 py-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <User className="w-5 h-5 text-primary" /> Basic Information
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">Your primary identity details linked to the core backend.</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isEditing ? (
              <>
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} disabled={isSaving}>Cancel</Button>
                <Button size="sm" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? <span className="flex items-center gap-2"><Spinner className="w-3 h-3" /> Saving...</span> : "Save"}
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>Edit</Button>
            )}
          </div>
        </div>
        <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">First Name</label>
            <input className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60 disabled:cursor-not-allowed" value={formData["identity.first_name"] || ""} onChange={e => handleInputChange("identity.first_name", e.target.value)} disabled={!isEditing} placeholder="e.g. Nikhil" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Last Name</label>
            <input className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60 disabled:cursor-not-allowed" value={formData["identity.last_name"] || ""} onChange={e => handleInputChange("identity.last_name", e.target.value)} disabled={!isEditing} placeholder="e.g. Shinde" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Date of Birth</label>
            <NikhilTimeCalendar
              value={dobDate}
              onChange={(date: Date | undefined) => {
                if (date) {
                  handleInputChange("identity.date_of_birth", date.toISOString());
                  handleInputChange("dob", date.toISOString());
                }
              }}
              showTime={false}
              placeholder="Not specified"
              className={cn("w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60 disabled:cursor-not-allowed", !isEditing && "pointer-events-none opacity-60")}
            />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-sm font-medium text-foreground">Bio</label>
            <textarea className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60 disabled:cursor-not-allowed resize-none" rows={3} value={formData["social.bio"] || formData.bio || ""} onChange={e => handleInputChange("social.bio", e.target.value)} disabled={!isEditing} placeholder="A short bio about yourself" />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-sm font-medium text-foreground">Hobbies</label>
            <input className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60 disabled:cursor-not-allowed" value={formData["social.hobby"] || formData.hobby || ""} onChange={e => handleInputChange("social.hobby", e.target.value)} disabled={!isEditing} placeholder="e.g. Reading, Coding, Travel" />
          </div>
        </div>
      </div>

      <div className="border rounded-xl bg-card shadow-sm overflow-hidden">
        <div className="border-b bg-muted/10 px-6 py-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" /> Social Status
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">Your public links, developer profiles and tech stack.</p>
        </div>
        <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-sm font-medium text-foreground">Tech Stack</label>
            <input className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60 disabled:cursor-not-allowed" value={formData["social.tech_stack"] || ""} onChange={e => handleInputChange("social.tech_stack", e.target.value)} disabled={!isEditing} placeholder="e.g. React, Node.js, AWS" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">LinkedIn</label>
            <input className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60 disabled:cursor-not-allowed" value={formData["social.linkedin"] || ""} onChange={e => handleInputChange("social.linkedin", e.target.value)} disabled={!isEditing} placeholder="https://linkedin.com/in/..." />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">GitHub</label>
            <input className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60 disabled:cursor-not-allowed" value={formData["social.github"] || ""} onChange={e => handleInputChange("social.github", e.target.value)} disabled={!isEditing} placeholder="https://github.com/..." />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Twitter / X</label>
            <input className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60 disabled:cursor-not-allowed" value={formData["social.twitter"] || ""} onChange={e => handleInputChange("social.twitter", e.target.value)} disabled={!isEditing} placeholder="https://x.com/..." />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Coding Profile (LeetCode/HackerRank)</label>
            <input className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60 disabled:cursor-not-allowed" value={formData["social.coding_profile"] || ""} onChange={e => handleInputChange("social.coding_profile", e.target.value)} disabled={!isEditing} placeholder="https://leetcode.com/..." />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Portfolio Website</label>
            <input className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60 disabled:cursor-not-allowed" value={formData["social.portfolio"] || ""} onChange={e => handleInputChange("social.portfolio", e.target.value)} disabled={!isEditing} placeholder="https://yourwebsite.com" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Instagram</label>
            <input className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60 disabled:cursor-not-allowed" value={formData["social.instagram"] || ""} onChange={e => handleInputChange("social.instagram", e.target.value)} disabled={!isEditing} placeholder="https://instagram.com/..." />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Facebook</label>
            <input className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60 disabled:cursor-not-allowed" value={formData["social.facebook"] || ""} onChange={e => handleInputChange("social.facebook", e.target.value)} disabled={!isEditing} placeholder="https://facebook.com/..." />
          </div>
        </div>
      </div>
    </div>
  );
}
