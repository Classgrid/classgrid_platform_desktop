/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

export const FOOTER_STATUS_STATES = [
  "operational",
  "degraded",
  "partial_outage",
  "major_outage",
  "maintenance",
  "automatic",
] as const;

export type FooterStatusState = (typeof FOOTER_STATUS_STATES)[number];

export const DEFAULT_FOOTER_STATUS_STATE: FooterStatusState = "operational";

const FOOTER_STATUS_STATE_SET = new Set<string>(FOOTER_STATUS_STATES);

const FOOTER_STATUS_DOT_CLASS_MAP: Record<FooterStatusState, string> = {
  operational: "bg-emerald-500",
  degraded: "bg-amber-500",
  partial_outage: "bg-orange-500",
  major_outage: "bg-red-500",
  maintenance: "bg-blue-500",
  automatic: "bg-emerald-500", // Fallback for automatic while loading
};

const FOOTER_STATUS_TEXT_CLASS_MAP: Record<FooterStatusState, string> = {
  operational: "text-emerald-500",
  degraded: "text-amber-500",
  partial_outage: "text-orange-500",
  major_outage: "text-red-500",
  maintenance: "text-blue-500",
  automatic: "text-emerald-500",
};

const FOOTER_STATUS_DEFAULT_LABEL_MAP: Record<FooterStatusState, string> = {
  operational: "Operational",
  degraded: "Degraded Performance",
  partial_outage: "Partial Outage",
  major_outage: "Major Outage",
  maintenance: "Under Maintenance",
};

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function normalizeFooterStatusState(state?: string | null): FooterStatusState {
  if (typeof state === "string" && FOOTER_STATUS_STATE_SET.has(state)) {
    return state as FooterStatusState;
  }

  return DEFAULT_FOOTER_STATUS_STATE;
}

export function getFooterStatusDotClass(state?: string | null): string {
  return FOOTER_STATUS_DOT_CLASS_MAP[normalizeFooterStatusState(state)];
}

export function getFooterStatusTextClass(state?: string | null): string {
  return FOOTER_STATUS_TEXT_CLASS_MAP[normalizeFooterStatusState(state)];
}

export function getFooterStatusLabel(state?: string | null, label?: string | null): string {
  const trimmedLabel = label?.trim();

  if (trimmedLabel) {
    return trimmedLabel;
  }

  return FOOTER_STATUS_DEFAULT_LABEL_MAP[normalizeFooterStatusState(state)];
}

export function resolveFooterCopyrightText(
  text?: string | null,
  brandName?: string | null,
): string {
  const currentYear = new Date().getFullYear();
  const fallbackBrandName = brandName?.trim() || "Classgrid";
  const fallbackText = `© ${currentYear} ${fallbackBrandName}. All rights reserved.`;
  const trimmedText = text?.trim();

  if (!trimmedText) {
    return fallbackText;
  }

  const normalizedBody = normalizeWhitespace(
    trimmedText
      .replace(/\b\d{4}\b/g, " ")
      .replace(/^(©|copyright)\s*/i, ""),
  );

  if (!normalizedBody) {
    return fallbackText;
  }

  return `© ${currentYear} ${normalizedBody}`;
}

import { apiClient } from "./apiClient";

function parseStatuspageData(data: any): { state: FooterStatusState; label: string } | null {
  // 1. Check for active maintenance
  if (data.scheduled_maintenances && data.scheduled_maintenances.length > 0) {
    const activeMaintenance = data.scheduled_maintenances.find(
      (m: any) => m.status === "in_progress" || m.status === "verifying"
    );
    if (activeMaintenance) {
      return { state: "maintenance", label: "Under Maintenance" };
    }
  }

  // Safely check if status object exists before reading it
  if (!data.status || typeof data.status !== "object") {
    return null;
  }

  // 2. Map Statuspage indicators to our FooterStatusState
  const indicator = data.status.indicator;

  // Default to the generic description (e.g. "All Systems Operational")
  let description = data.status.description;

  // If there is an active incident, use the actual custom incident name!
  if (data.incidents && data.incidents.length > 0) {
    const activeIncident = data.incidents.find((i: any) =>
      i.status === "investigating" || i.status === "identified" || i.status === "monitoring"
    );
    if (activeIncident && activeIncident.name) {
      description = activeIncident.name;
    }
  }

  let state: FooterStatusState = "operational";
  if (indicator === "minor") state = "degraded";
  if (indicator === "major") state = "partial_outage";
  if (indicator === "critical") state = "major_outage";

  return { state, label: description };
}

export async function fetchLiveStatus(pageId: string): Promise<{ state: FooterStatusState; label: string } | null> {
  try {
    // Build the URL using the same logic as the marketing site:
    // If pageId contains a dot (e.g. "status.classgrid.in"), it's a custom domain
    // hosted on Incident.io — call it directly. Incident.io returns a response
    // that is backwards-compatible with the Atlassian Statuspage API format.
    let url = `https://${pageId}.statuspage.io/api/v2/summary.json`;
    if (pageId.includes('.')) {
      url = `https://${pageId}/api/v2/summary.json`;
    }

    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    return parseStatuspageData(data);
  } catch (error) {
    console.error("Failed to fetch live status:", error);
    return null;
  }
}
