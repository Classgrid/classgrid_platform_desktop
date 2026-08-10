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

// Direct public Statuspage URL — works even when our main server is down
const STATUSPAGE_DIRECT_URL = "https://classgrid1.statuspage.io/api/v2/summary.json";

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
  // ─── Strategy 1: Call Statuspage directly from the browser ───────────────
  // This works even when our main server is DOWN — Statuspage is a public
  // third-party API with no CORS restrictions on its summary endpoint.
  try {
    const response = await fetch(`https://${pageId}.statuspage.io/api/v2/summary.json`);
    if (response.ok) {
      const data = await response.json();
      return parseStatuspageData(data);
    }
  } catch {
    // Direct call failed (network issue?) — fall through to backend proxy
  }

  // ─── Strategy 2: Backend proxy (fallback, only if main server is up) ──────
  try {
    const response = await apiClient.get(`/api/system/status?pageId=${pageId}`);
    return parseStatuspageData(response.data);
  } catch (error) {
    console.error("Failed to fetch live status:", error);
    return null;
  }
}
