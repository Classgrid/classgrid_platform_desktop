import React from "react";
import { CopySnippetCard } from "@/components/marketing_ui/copy-snippet-card";
import { useUserProfile } from "../../queries/useUserProfile";

export function SettingsIdentityCard() {
  const { data: userProfile } = useUserProfile();

  if (!userProfile) return null;

  return (
    <>
      <CopySnippetCard
        title="User ID"
        description="Your unique user identifier."
        value={(userProfile as any)._id || userProfile.id || "N/A"}
      />
      
      <CopySnippetCard
        title="Organization ID"
        description="Use this ID to identify your organization when contacting support."
        value={
          (userProfile.organization_id as any)?._id || 
          userProfile.organization_id?.id || 
          (typeof userProfile.organization_id === 'string' ? userProfile.organization_id : "N/A")
        }
      />
    </>
  );
}
