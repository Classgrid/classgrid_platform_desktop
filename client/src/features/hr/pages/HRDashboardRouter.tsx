/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

import { InstitutionDashboardGate } from "@/features/org/components/InstitutionDashboardGate";
import { CoachingHRDashboard } from "./CoachingHRDashboard";
import { EngineeringHRDashboard } from "./EngineeringHRDashboard";
import { HrDashboardPage } from "./HrDashboardPage";
import { JuniorCollegeHRDashboard } from "./JuniorCollegeHRDashboard";
import { SchoolHRDashboard } from "./SchoolHRDashboard";

export function HRDashboardRouter() {
  return (
    <InstitutionDashboardGate
      fallback={<HrDashboardPage />}
      screens={{
        school: <SchoolHRDashboard />,
        junior_college: <JuniorCollegeHRDashboard />,
        engineering: <EngineeringHRDashboard />,
        coaching: <CoachingHRDashboard />,
      }}
    />
  );
}
