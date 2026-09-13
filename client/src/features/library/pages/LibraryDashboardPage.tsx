/*
 * =========================================================================================
 * 🚨 CRITICAL AI & SYSTEM RULE 🚨
 * NO FRONTEND GITHUB ACTIONS: NEVER create yaml files that build/deploy the frontend to EC2.
 * The frontend is hosted 100% on Vercel. EC2 is only for the backend.
 * =========================================================================================
 */

import { AskAiPanel } from "@/components/ai/components/AskAiPanel";

export function LibraryDashboardPage() {
  return (
    <div className="flex flex-col w-full h-full relative bg-background">
      <AskAiPanel 
        open={true} 
        onOpenChange={() => {}} 
        variant="full-page"
        pageContext={{
          path: "/dept/library/dashboard",
          title: "Library Agent"
        }}
      />
    </div>
  );
}
