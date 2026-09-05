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

import { useQuery } from "@tanstack/react-query";

import { addDays, subDays } from "date-fns";

export type CalendarEvent = {
  id: string;
  date: Date;
  title: string;
  type: string;
};

export function useAcademicCalendar() {
  return useQuery({
    queryKey: ["org-admin", "academic-calendar"],
    queryFn: async () => {
      // In a real implementation, this would be:
      // const { data } = await apiClient.get<CalendarEvent[]>("/api/org-admin/calendar/events");
      // return data;
      
      const today = new Date();
      
      // Returning realistic mock data for the UI demonstration
      const mockEvents: CalendarEvent[] = [
        {
          id: "1",
          date: today,
          title: "Physics 101 Lecture",
          type: "lecture",
        },
        {
          id: "2",
          date: today,
          title: "Math Department Meeting",
          type: "other",
        },
        {
          id: "3",
          date: addDays(today, 2),
          title: "Mid-Term Examination starts",
          type: "exam",
        },
        {
          id: "4",
          date: addDays(today, 2),
          title: "Chemistry Lab Eval",
          type: "exam",
        },
        {
          id: "5",
          date: addDays(today, 5),
          title: "National Holiday (Diwali)",
          type: "holiday",
        },
        {
          id: "6",
          date: subDays(today, 1),
          title: "Attendance Audit",
          type: "attendance",
        },
        {
          id: "7",
          date: addDays(today, 14),
          title: "Semester Results Announcement",
          type: "other",
        }
      ];
      
      return mockEvents;
    },
  });
}
