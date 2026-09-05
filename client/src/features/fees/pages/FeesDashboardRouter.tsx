/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
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
