import React, { useState } from "react";
import { User, Globe } from "lucide-react";
import { Button } from "@/components/marketing_ui/button";
import { Spinner } from "@/components/marketing_ui/spinner";
import { NikhilTimeCalendar } from "@/components/marketing_ui/nikhil_time_calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { apiClient } from "@/lib/apiClient";
import { useQueryClient } from "@tanstack/react-query";

export function SuperAdminProfileView({ profileData }: { profileData: any }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Record<string, any>>({
    ...(profileData || {}),
    ...(profileData?.metadata || {})
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    if (profileData) {
      const nameParts = (profileData.name || "").trim().split(/\s+/);
      const m = profileData.metadata || {};
      setFormData(prev => ({
        ...prev,
        ...profileData,
        ...m,
        "identity.first_name": m?.["identity.first_name"] || nameParts[0] || "",
        "identity.last_name": m?.["identity.last_name"] || nameParts.slice(1).join(" ") || "",
        "linkedin_url": m?.["linkedin_url"] || m?.["linkedin_url"] || "",
        "github_url": m?.["github_url"] || m?.["github_url"] || "",
        "twitter_url": m?.["twitter_url"] || m?.["twitter_url"] || "",
        "coding_profile": m?.["coding_profile"] || m?.["coding_profile"] || "",
        "portfolio_url": m?.["portfolio_url"] || m?.["portfolio_url"] || "",
        "instagram_url": m?.["instagram_url"] || m?.["instagram_url"] || "",
        "facebook_url": m?.["facebook_url"] || m?.["facebook_url"] || "",
        "tech_stack": m?.["tech_stack"] || m?.["tech_stack"] || "",
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
        bio: formData["bio"] || formData.bio || "",
        hobby: formData["hobby"] || formData.hobby || "",
        metadata: {
          "identity.first_name": firstName,
          "identity.last_name": lastName,
          "identity.date_of_birth": formData["identity.date_of_birth"] || "",
          "bio": formData["bio"] || formData.bio || "",
          "hobby": formData["hobby"] || formData.hobby || "",
          "tech_stack": formData["tech_stack"] || "",
          "linkedin_url": formData["linkedin_url"] || "",
          "github_url": formData["github_url"] || "",
          "twitter_url": formData["twitter_url"] || "",
          "coding_profile": formData["coding_profile"] || "",
          "portfolio_url": formData["portfolio_url"] || "",
          "instagram_url": formData["instagram_url"] || "",
          "facebook_url": formData["facebook_url"] || "",
        }
      });
      queryClient.invalidateQueries({ queryKey: ["global-profile"] });
      queryClient.invalidateQueries({ queryKey: ["current-user"] });
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
            <input className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed placeholder:text-muted-foreground/30 disabled:text-foreground disabled:bg-muted/10" value={formData["identity.first_name"] || ""} onChange={e => handleInputChange("identity.first_name", e.target.value)} disabled={!isEditing} placeholder="e.g. Nikhil" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Last Name</label>
            <input className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed placeholder:text-muted-foreground/30 disabled:text-foreground disabled:bg-muted/10" value={formData["identity.last_name"] || ""} onChange={e => handleInputChange("identity.last_name", e.target.value)} disabled={!isEditing} placeholder="e.g. Shinde" />
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
              className={cn("w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed placeholder:text-muted-foreground/30 disabled:text-foreground disabled:bg-muted/10", !isEditing && "pointer-events-none opacity-60")}
            />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-sm font-medium text-foreground">Bio</label>
            <textarea className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed placeholder:text-muted-foreground/30 disabled:text-foreground disabled:bg-muted/10 resize-none" rows={3} value={formData["bio"] || formData.bio || ""} onChange={e => handleInputChange("bio", e.target.value)} disabled={!isEditing} placeholder="A short bio about yourself" />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-sm font-medium text-foreground">Hobbies</label>
            <input className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed placeholder:text-muted-foreground/30 disabled:text-foreground disabled:bg-muted/10" value={formData["hobby"] || formData.hobby || ""} onChange={e => handleInputChange("hobby", e.target.value)} disabled={!isEditing} placeholder="e.g. Reading, Coding, Travel" />
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
            <input className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed placeholder:text-muted-foreground/30 disabled:text-foreground disabled:bg-muted/10" value={formData["tech_stack"] || ""} onChange={e => handleInputChange("tech_stack", e.target.value)} disabled={!isEditing} placeholder="e.g. React, Node.js, AWS" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">LinkedIn</label>
            <div className="relative">
              <input className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed placeholder:text-muted-foreground/30 disabled:text-foreground disabled:bg-muted/10" value={formData["linkedin_url"] || ""} onChange={e => handleInputChange("linkedin_url", e.target.value)} disabled={!isEditing} placeholder="https://linkedin.com/in/..." />
              {!isEditing && formData["linkedin_url"] && (
                <a href={formData["linkedin_url"]} target="_blank" rel="noopener noreferrer" className="absolute inset-0 z-10 cursor-pointer" />
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">GitHub</label>
            <div className="relative">
              <input className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed placeholder:text-muted-foreground/30 disabled:text-foreground disabled:bg-muted/10" value={formData["github_url"] || ""} onChange={e => handleInputChange("github_url", e.target.value)} disabled={!isEditing} placeholder="https://github.com/..." />
              {!isEditing && formData["github_url"] && (
                <a href={formData["github_url"]} target="_blank" rel="noopener noreferrer" className="absolute inset-0 z-10 cursor-pointer" />
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Twitter / X</label>
            <div className="relative">
              <input className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed placeholder:text-muted-foreground/30 disabled:text-foreground disabled:bg-muted/10" value={formData["twitter_url"] || ""} onChange={e => handleInputChange("twitter_url", e.target.value)} disabled={!isEditing} placeholder="https://x.com/..." />
              {!isEditing && formData["twitter_url"] && (
                <a href={formData["twitter_url"]} target="_blank" rel="noopener noreferrer" className="absolute inset-0 z-10 cursor-pointer" />
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Coding Profile (LeetCode/HackerRank)</label>
            <div className="relative">
              <input className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed placeholder:text-muted-foreground/30 disabled:text-foreground disabled:bg-muted/10" value={formData["coding_profile"] || ""} onChange={e => handleInputChange("coding_profile", e.target.value)} disabled={!isEditing} placeholder="https://leetcode.com/..." />
              {!isEditing && formData["coding_profile"] && (
                <a href={formData["coding_profile"]} target="_blank" rel="noopener noreferrer" className="absolute inset-0 z-10 cursor-pointer" />
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Portfolio Website</label>
            <div className="relative">
              <input className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed placeholder:text-muted-foreground/30 disabled:text-foreground disabled:bg-muted/10" value={formData["portfolio_url"] || ""} onChange={e => handleInputChange("portfolio_url", e.target.value)} disabled={!isEditing} placeholder="https://yourwebsite.com" />
              {!isEditing && formData["portfolio_url"] && (
                <a href={formData["portfolio_url"]} target="_blank" rel="noopener noreferrer" className="absolute inset-0 z-10 cursor-pointer" />
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Instagram</label>
            <div className="relative">
              <input className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed placeholder:text-muted-foreground/30 disabled:text-foreground disabled:bg-muted/10" value={formData["instagram_url"] || ""} onChange={e => handleInputChange("instagram_url", e.target.value)} disabled={!isEditing} placeholder="https://instagram.com/..." />
              {!isEditing && formData["instagram_url"] && (
                <a href={formData["instagram_url"]} target="_blank" rel="noopener noreferrer" className="absolute inset-0 z-10 cursor-pointer" />
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Facebook</label>
            <div className="relative">
              <input className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed placeholder:text-muted-foreground/30 disabled:text-foreground disabled:bg-muted/10" value={formData["facebook_url"] || ""} onChange={e => handleInputChange("facebook_url", e.target.value)} disabled={!isEditing} placeholder="https://facebook.com/..." />
              {!isEditing && formData["facebook_url"] && (
                <a href={formData["facebook_url"]} target="_blank" rel="noopener noreferrer" className="absolute inset-0 z-10 cursor-pointer" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

