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
      
      {userProfile.orgId && (
        <CopySnippetCard
          title="Organization ID"
          description="Use this ID to identify your organization when contacting support."
          value={userProfile.orgId}
        />
      )}
    </>
  );
}
