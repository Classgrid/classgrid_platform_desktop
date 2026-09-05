/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

/*
 * ─────────────────────────────────────────────────────────
 * 🚨 CRITICAL AI AND SYSTEM RULES 🚨
 * 1. NEVER DELETE ANY ENVIRONMENT VARIABLES.
 * 2. LOCALHOST TESTING IS STRICTLY BANNED. NO AI WILL EVER TRY TO WORK LOCALLY.
 * 3. THIS REPO IS PRODUCTION-FIRST. DO NOT TOUCH OR REMOVE KEYS.
 * ─────────────────────────────────────────────────────────
 */

import type { ReactNode } from "react";
import { Spinner } from "@/components/marketing_ui/spinner";
import {
  type InstitutionDashboardVariant,
  type InstitutionProfile,
  useInstitutionProfile } from "../queries/useInstitutionProfile";

type InstitutionDashboardGateProps = {
  fallback: ReactNode;
  screens: Partial<Record<InstitutionDashboardVariant, ReactNode>>;
  selectVariant?: (profile: InstitutionProfile) => InstitutionDashboardVariant;
};

export function InstitutionDashboardGate({
  fallback,
  screens,
  selectVariant = (profile) => profile.dashboardVariant }: InstitutionDashboardGateProps) {
  const { data: profile, isLoading, isError } = useInstitutionProfile();

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner className="h-6 w-6  text-muted-foreground" />
      </div>
    );
  }

  if (isError || !profile) {
    return <>{fallback}</>;
  }

  return <>{screens[selectVariant(profile)] ?? fallback}</>;
}
