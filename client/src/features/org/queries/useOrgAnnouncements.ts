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

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

export type OrgAnnouncementStatus = "draft" | "scheduled" | "published";
export type OrgAnnouncementType = "announcement" | "notice" | "event" | "holiday" | "emergency";
export type OrgAnnouncementTargetType = "all" | "specific";

export type OrgAnnouncementClassroom = {
  _id: string;
  name?: string;
  subject?: string;
  facultyName?: string;
  studentCount?: number;
};

export type OrgAnnouncement = {
  _id: string;
  id?: string;
  title: string;
  content: string;
  type: OrgAnnouncementType;
  target_type: OrgAnnouncementTargetType;
  target_classrooms?: OrgAnnouncementClassroom[];
  status: OrgAnnouncementStatus;
  views_count?: number;
  sent_at?: string | null;
  expires_at?: string | null;
  createdAt?: string;
  updatedAt?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: {
    _id?: string;
    name?: string;
    email?: string;
  };
};

export type OrgAnnouncementsResponse = {
  announcements: OrgAnnouncement[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export type CreateOrgAnnouncementPayload = {
  title: string;
  content: string;
  type: OrgAnnouncementType;
  target_type: OrgAnnouncementTargetType;
  target_classrooms?: string[];
  status: OrgAnnouncementStatus;
  expires_at?: string | null;
};

export function useOrgAnnouncements(page = 1, limit = 20) {
  return useQuery({
    queryKey: ["org", "announcements", page, limit],
    queryFn: async () => {
      const { data } = await apiClient.get<OrgAnnouncementsResponse>("/api/organization/announcements", {
        params: { page, limit },
      });
      return data;
    },
  });
}

export function useOrgAnnouncementClassrooms() {
  return useQuery({
    queryKey: ["org", "announcement-classrooms"],
    queryFn: async () => {
      const { data } = await apiClient.get<OrgAnnouncementClassroom[]>("/api/organization/classrooms");
      return data;
    },
  });
}

export function useCreateOrgAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateOrgAnnouncementPayload) => {
      const { data } = await apiClient.post<{ message: string; announcement: OrgAnnouncement }>(
        "/api/organization/announcements",
        payload,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org", "announcements"] });
    },
  });
}
