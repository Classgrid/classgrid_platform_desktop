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

import { InstitutionDashboardGate } from "@/features/org/components/InstitutionDashboardGate";
import { CoachingExamsDashboard } from "./CoachingExamsDashboard";
import { EngineeringExamsDashboard } from "./EngineeringExamsDashboard";
import { ExamsDashboardPage } from "./ExamsDashboardPage";
import { JuniorCollegeExamsDashboard } from "./JuniorCollegeExamsDashboard";
import { SchoolExamsDashboard } from "./SchoolExamsDashboard";

export function ExamsDashboardRouter() {
  return (
    <InstitutionDashboardGate
      fallback={<ExamsDashboardPage />}
      screens={{
        school: <SchoolExamsDashboard />,
        junior_college: <JuniorCollegeExamsDashboard />,
        engineering: <EngineeringExamsDashboard />,
        coaching: <CoachingExamsDashboard />,
      }}
    />
  );
}
