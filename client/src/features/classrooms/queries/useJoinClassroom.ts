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

/*
 * ─────────────────────────────────────────────────────────
 * 🚨 HOSTING & ARCHITECTURE RULE 🚨
 * 1. BACKEND IS HOSTED ON AWS EC2 AT API.CLASSGRID.IN
 * 2. FRONTEND IS HOSTED ON VERCEL
 * ─────────────────────────────────────────────────────────
 */

// useJoinClassroom.ts — POST /api/classrooms/join-by-code (mutation)
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { classroomApi } from '../services/classroomApi';

export function useJoinClassroom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ classCode, requestMessage }: { classCode: string; requestMessage?: string }) =>
      classroomApi.joinByCode(classCode, requestMessage),
    onSuccess: () => {
      // Invalidate classroom list so the new classroom shows up
      queryClient.invalidateQueries({ queryKey: ['classrooms'] });
    },
  });
}

export function useRequestToJoin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ classroomId, requestMessage }: { classroomId: string; requestMessage?: string }) =>
      classroomApi.requestToJoin(classroomId, requestMessage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classrooms'] });
    },
  });
}
