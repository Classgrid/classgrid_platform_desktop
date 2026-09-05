/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

import { InstitutionDashboardGate } from "@/features/org/components/InstitutionDashboardGate";
import { AdmissionDashboardPage } from "./AdmissionDashboardPage";
import { CoachingAdmissionDashboard } from "./CoachingAdmissionDashboard";
import { EngineeringAdmissionDashboard } from "./EngineeringAdmissionDashboard";
import { JuniorCollegeAdmissionDashboard } from "./JuniorCollegeAdmissionDashboard";
import { SchoolAdmissionDashboard } from "./SchoolAdmissionDashboard";

export function AdmissionDashboardRouter() {
  return (
    <InstitutionDashboardGate
      fallback={<AdmissionDashboardPage />}
      selectVariant={(profile) => profile.admissionProfile.dashboardVariant}
      screens={{
        school: <SchoolAdmissionDashboard />,
        junior_college: <JuniorCollegeAdmissionDashboard />,
        engineering: <EngineeringAdmissionDashboard />,
        coaching: <CoachingAdmissionDashboard />,
      }}
    />
  );
}
