/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

import { AppRouter } from "@/app/router";
import { Toaster } from "@/components/marketing_ui/sonner";
import { GlobalErrorBoundary } from "@/components/layout/GlobalErrorBoundary";

export function App() {
  return (
    <GlobalErrorBoundary>
      <div className="bg-background text-foreground min-h-screen w-full">
        <AppRouter />
        <Toaster />
      </div>
    </GlobalErrorBoundary>
  );
}
