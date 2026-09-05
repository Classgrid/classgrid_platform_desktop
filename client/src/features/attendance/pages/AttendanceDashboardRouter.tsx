/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

import { InstitutionDashboardGate } from "@/features/org/components/InstitutionDashboardGate";
import { AttendanceDashboardPage } from "./AttendanceDashboardPage";
import { CoachingAttendanceDashboard } from "./CoachingAttendanceDashboard";
import { EngineeringAttendanceDashboard } from "./EngineeringAttendanceDashboard";
import { JuniorCollegeAttendanceDashboard } from "./JuniorCollegeAttendanceDashboard";
import { SchoolAttendanceDashboard } from "./SchoolAttendanceDashboard";

export function AttendanceDashboardRouter() {
  return (
    <InstitutionDashboardGate
      fallback={<AttendanceDashboardPage />}
      screens={{
        school: <SchoolAttendanceDashboard />,
        junior_college: <JuniorCollegeAttendanceDashboard />,
        engineering: <EngineeringAttendanceDashboard />,
        coaching: <CoachingAttendanceDashboard />,
      }}
    />
  );
}
