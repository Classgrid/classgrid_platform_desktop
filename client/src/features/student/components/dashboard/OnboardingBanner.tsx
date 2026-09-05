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

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/marketing_ui/card";
import { Progress } from "@/components/marketing_ui/progress";
import { Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { OnboardingProgress } from "../../queries/useStudentDashboard";

export function OnboardingBanner({ data }: { data?: OnboardingProgress }) {
  if (!data || data.percentage === 100) return null;

  return (
    <Card className="bg-orange-500/10 border-orange-500/20 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
      <CardHeader className="pb-3">
        <CardTitle className="text-orange-700 dark:text-orange-400 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Complete Your Profile
        </CardTitle>
        <CardDescription className="text-orange-600/80 dark:text-orange-300/80">
          You have completed {data.completed} out of {data.total} steps.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <Progress 
            value={data.percentage} 
            className="h-2 flex-1 bg-orange-200 dark:bg-orange-900/50" 
            indicatorClassName="bg-orange-500" 
          />
          <span className="text-sm font-medium text-orange-700 dark:text-orange-400">
            {data.percentage}%
          </span>
        </div>
        <div className="mt-4">
          <Link to="/student/profile" className="text-sm font-semibold text-orange-600 dark:text-orange-400 hover:underline">
            Resume Onboarding &rarr;
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
