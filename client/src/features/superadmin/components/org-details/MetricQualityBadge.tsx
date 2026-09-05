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

import { Badge } from "@/components/marketing_ui/badge";

import type { MetricQuality } from "../../services/organizationControlCenterApi";

const qualityConfig = {
  actual: { label: "Live", variant: "success" },
  partial: { label: "Partial", variant: "warning" },
  unavailable: { label: "Not instrumented", variant: "neutral" },
} as const;

interface MetricQualityBadgeProps {
  quality: MetricQuality;
}

export function MetricQualityBadge({ quality }: MetricQualityBadgeProps) {
  const config = qualityConfig[quality];
  return (
    <Badge variant={config.variant} className="whitespace-nowrap">
      {config.label}
    </Badge>
  );
}
