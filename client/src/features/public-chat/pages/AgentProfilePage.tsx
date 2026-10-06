import React from "react";
import { PublicChatProfileView } from "../components/PublicChatProfileView";
import { useCurrentUser } from "@/features/auth/queries/useCurrentUser";
import { Spinner } from "@/components/marketing_ui/spinner";

export function AgentProfilePage() {
  const { data: user, isLoading } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      <h1 className="text-2xl font-bold mb-6">Agent Profile</h1>
      <PublicChatProfileView profileData={user || {}} />
    </div>
  );
}
