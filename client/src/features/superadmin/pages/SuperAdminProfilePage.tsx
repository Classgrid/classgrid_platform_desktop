import { useState, useEffect } from "react";
import { useCurrentUser } from "@/features/auth/queries/useCurrentUser";
import { apiClient } from "@/lib/apiClient";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { User, Globe, Loader2 } from "lucide-react";

export function SuperAdminProfilePage() {
  const { data: user, refetch } = useCurrentUser();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    dob: "",
    bio: "",
    hobby: "",
    linkedin_url: "",
    github_url: "",
    twitter_url: "",
    coding_profile: "",
    tech_stack: "",
    instagram_url: "",
    portfolio_url: "",
    facebook_url: ""
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        dob: user.dob ? new Date(user.dob).toISOString().split("T")[0] : "",
        bio: user.bio || "",
        hobby: user.hobby || "",
        linkedin_url: user.metadata?.linkedin_url || "",
        github_url: user.metadata?.github_url || "",
        twitter_url: user.metadata?.twitter_url || "",
        coding_profile: user.metadata?.coding_profile || "",
        tech_stack: user.metadata?.tech_stack || "",
        instagram_url: user.metadata?.instagram_url || "",
        portfolio_url: user.metadata?.portfolio_url || "",
        facebook_url: user.metadata?.facebook_url || ""
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await apiClient.put("/api/user/update", {
        name: formData.name,
        dob: formData.dob || null,
        bio: formData.bio,
        hobby: formData.hobby,
        metadata: {
          ...user?.metadata,
          linkedin_url: formData.linkedin_url,
          github_url: formData.github_url,
          twitter_url: formData.twitter_url,
          coding_profile: formData.coding_profile,
          tech_stack: formData.tech_stack,
          instagram_url: formData.instagram_url,
          portfolio_url: formData.portfolio_url,
          facebook_url: formData.facebook_url
        }
      });
      toast.success("Profile details updated successfully");
      refetch();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Super Admin Profile</h1>
          <p className="text-muted-foreground mt-1">Manage your personal and social details natively.</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="min-w-[140px]">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Basic Profile */}
        <Card className="border-muted shadow-sm">
          <CardHeader className="border-b bg-muted/10 pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="w-5 h-5 text-primary" /> Basic Information
            </CardTitle>
            <CardDescription>Your primary identity details linked to the core backend.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input name="name" value={formData.name} onChange={handleChange} placeholder="e.g. John Doe" />
            </div>
            <div className="space-y-2">
              <Label>Date of Birth</Label>
              <Input type="date" name="dob" value={formData.dob} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea name="bio" value={formData.bio} onChange={handleChange} placeholder="A short bio about yourself" rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Hobbies</Label>
              <Input name="hobby" value={formData.hobby} onChange={handleChange} placeholder="e.g. Reading, Coding, Travel" />
            </div>
          </CardContent>
        </Card>

        {/* Social Status */}
        <Card className="border-muted shadow-sm">
          <CardHeader className="border-b bg-muted/10 pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" /> Social Status
            </CardTitle>
            <CardDescription>Your public links, developer profiles and tech stack.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label>Tech Stack</Label>
              <Input name="tech_stack" value={formData.tech_stack} onChange={handleChange} placeholder="e.g. React, Node.js, AWS" />
            </div>
            <div className="space-y-2">
              <Label>LinkedIn URL</Label>
              <Input name="linkedin_url" value={formData.linkedin_url} onChange={handleChange} placeholder="https://linkedin.com/in/..." />
            </div>
            <div className="space-y-2">
              <Label>GitHub URL</Label>
              <Input name="github_url" value={formData.github_url} onChange={handleChange} placeholder="https://github.com/..." />
            </div>
            <div className="space-y-2">
              <Label>Twitter / X URL</Label>
              <Input name="twitter_url" value={formData.twitter_url} onChange={handleChange} placeholder="https://x.com/..." />
            </div>
            <div className="space-y-2">
              <Label>Coding Profile (LeetCode/HackerRank)</Label>
              <Input name="coding_profile" value={formData.coding_profile} onChange={handleChange} placeholder="https://leetcode.com/..." />
            </div>
            <div className="space-y-2">
              <Label>Portfolio Website</Label>
              <Input name="portfolio_url" value={formData.portfolio_url} onChange={handleChange} placeholder="https://yourwebsite.com" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
