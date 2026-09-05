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

import OnboardingEvent from "../models/OnboardingEvent.js";

export async function trackOnboardingEvent({
  organizationId = null,
  demoRequestId = null,
  userId = null,
  eventType,
  stage = "",
  actorRole = "",
  metadata = {},
}) {
  if (!eventType) return null;

  try {
    return await OnboardingEvent.create({
      organizationId,
      demoRequestId,
      userId,
      eventType,
      stage,
      actorRole,
      metadata,
    });
  } catch (error) {
    console.warn("[OnboardingEvent] Failed to record event:", error.message);
    return null;
  }
}
