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

// useTerminology.ts — Fetches & caches org terminology labels
// This is the MOST IMPORTANT hook in the classroom feature.
// Every UI label MUST come from here. NEVER hardcode "Semester", "Division", etc.
import { useQuery } from '@tanstack/react-query';
import { hierarchyApi } from '../services/classroomApi';
import type { Terminology } from '../types/classroom.types';

export function useTerminology() {
  return useQuery({
    queryKey: ['hierarchy', 'terminology'],
    queryFn: async () => {
      const response = await hierarchyApi.getTerminology();
      return response;
    },
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes — terminology rarely changes
  });
}

// Helper: Get a specific term with fallback
export function useTerm(key: keyof Terminology, fallback = ''): string {
  const { data } = useTerminology();
  if (!data?.terminology) return fallback;
  return (data.terminology[key] as string) ?? fallback;
}
