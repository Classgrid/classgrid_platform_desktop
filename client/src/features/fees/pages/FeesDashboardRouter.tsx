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

/*
 * ─────────────────────────────────────────────────────────
 * 🚨 NAMING CONVENTION RULE 🚨
 * 1. "CLASSGRID PLATFORM" is strictly the REPO NAME.
 * 2. "CLASSGRID ERP" is the actual PRODUCT NAME.
 * 3. NEVER use "Classgrid Platform" anywhere in the frontend UI or user-facing text.
 * ─────────────────────────────────────────────────────────
 */

/*
 * ─────────────────────────────────────────────────────────
 * 🚨 HOSTING & ARCHITECTURE RULE 🚨
 * 1. BACKEND IS HOSTED ON AWS EC2 AT API.CLASSGRID.IN
 * 2. FRONTEND IS HOSTED ON VERCEL
 * ─────────────────────────────────────────────────────────
 */

import { InstitutionDashboardGate } from "@/features/org/components/InstitutionDashboardGate";
import { CoachingFeesDashboard } from "./CoachingFeesDashboard";
import { EngineeringFeesDashboard } from "./EngineeringFeesDashboard";
import { FeesDashboardPage } from "./FeesDashboardPage";
import { JuniorCollegeFeesDashboard } from "./JuniorCollegeFeesDashboard";
import { SchoolFeesDashboard } from "./SchoolFeesDashboard";

export function FeesDashboardRouter() {
  return (
    <InstitutionDashboardGate
      fallback={<FeesDashboardPage />}
      screens={{
        school: <SchoolFeesDashboard />,
        junior_college: <JuniorCollegeFeesDashboard />,
        engineering: <EngineeringFeesDashboard />,
        coaching: <CoachingFeesDashboard />,
      }}
    />
  );
}
