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

import type {
  InstitutionHierarchyLevel,
  InstitutionProfile,
} from "../queries/useInstitutionProfile";

const fallbackTerms = {
  learner: "Learner",
  educator: "Educator",
  program: "Program",
  group: "Group",
  institution: "Institution",
} as const;

export function getProfileTerm(
  profile: InstitutionProfile,
  key: keyof typeof fallbackTerms,
) {
  return profile.terminology[key]?.trim() || fallbackTerms[key];
}

export function pluralizeLabel(label: string) {
  const normalized = label.trim();
  const lower = normalized.toLowerCase();

  if (!normalized || lower === "faculty" || lower === "staff" || lower.endsWith("s")) {
    return normalized;
  }

  if (lower.endsWith("y") && !lower.endsWith("ay") && !lower.endsWith("ey")) {
    return `${normalized.slice(0, -1)}ies`;
  }

  return `${normalized}s`;
}

export function getProfileTermPlural(
  profile: InstitutionProfile,
  key: "learner" | "educator" | "program" | "group" | "institution",
) {
  const explicitPlural =
    profile.terminology[`${key}_plural`] ??
    profile.terminology[`${key}Plural`] ??
    profile.terminology[`${key}s`];

  return explicitPlural?.trim() || pluralizeLabel(getProfileTerm(profile, key));
}

export function lowerLabel(label: string) {
  return label.charAt(0).toLowerCase() + label.slice(1);
}

export function isModuleEnabled(profile: InstitutionProfile, moduleKey: string) {
  return profile.enabledModules.includes(moduleKey);
}

export function getPrimaryHierarchyLevel(profile: InstitutionProfile): InstitutionHierarchyLevel {
  const preferredLevels: InstitutionHierarchyLevel[] = [
    "standard",
    "stream",
    "department",
    "course",
    "degree",
  ];

  return (
    preferredLevels.find((level) => profile.academicHierarchy.includes(level)) ??
    profile.academicHierarchy[0] ??
    "course"
  );
}

export function getPrimaryHierarchyLabel(profile: InstitutionProfile) {
  const level = getPrimaryHierarchyLevel(profile);
  return profile.levelLabels[level] ?? getProfileTerm(profile, "program");
}
