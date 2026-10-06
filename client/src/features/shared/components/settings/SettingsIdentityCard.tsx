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
        value={userProfile.id}
      />
      
      {userProfile.organization_id && (
        <CopySnippetCard
          title="Organization ID"
          description="Use this ID to identify your organization when contacting support."
          value={(userProfile.organization_id as any)?._id || userProfile.organization_id?.id || String(userProfile.organization_id)}
        />
      )}
    </>
  );
}
