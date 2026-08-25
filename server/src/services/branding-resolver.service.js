/**
 * branding-resolver.service.js
 *
 * Production-Grade Tenant Branding Resolver
 *
 * Resolves organization branding (site_title, favicon_url) from hostname/slug
 * using the shared LRU tenant cache. Provides XSS-safe HTML escaping and
 * deterministic template injection for the SPA document shell.
 *
 * Architecture:
 *   Request Host → resolve tenant → inject <head> → serve SPA shell → React hydrates
 *
 * This is the same pattern used by Atlassian, Shopify, Notion, and Slack
 * for multi-tenant SPA branding without full SSR.
 */

import Organization from "../models/Organization.js";

// ─── Dedicated Branding Cache (separate from tenant auth cache) ──────
// This cache stores only branding fields (site_title, favicon_url, name)
// with a 5-minute TTL. Keeping it separate from the auth tenant cache
// avoids coupling branding resolution with auth middleware.
const BRANDING_CACHE = new Map();
const BRANDING_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const BRANDING_CACHE_MAX_SIZE = 500;

function getCachedBranding(key) {
  const entry = BRANDING_CACHE.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > BRANDING_CACHE_TTL_MS) {
    BRANDING_CACHE.delete(key);
    return null;
  }
  return entry.branding;
}

function setCachedBranding(key, branding) {
  if (BRANDING_CACHE.size >= BRANDING_CACHE_MAX_SIZE) {
    const firstKey = BRANDING_CACHE.keys().next().value;
    BRANDING_CACHE.delete(firstKey);
  }
  BRANDING_CACHE.set(key, { branding, timestamp: Date.now() });
}

/** Invalidate branding cache for a specific host (call after org branding update) */
export function invalidateBrandingCache(host) {
  if (host) BRANDING_CACHE.delete(host.toLowerCase());
}

/** Clear entire branding cache */
export function clearBrandingCache() {
  BRANDING_CACHE.clear();
}

// ─── XSS-Safe HTML Escaping ─────────────────────────────────────────
// Prevents injection attacks from malicious site_title or favicon_url values.
const HTML_ESCAPE_MAP = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(str) {
  if (!str) return "";
  return String(str).replace(/[&<>"']/g, (c) => HTML_ESCAPE_MAP[c]);
}

export function escapeAttr(str) {
  if (!str) return "";
  // For HTML attributes: escape quotes, ampersands, angle brackets
  return String(str).replace(/[&<>"']/g, (c) => HTML_ESCAPE_MAP[c]);
}

// ─── URL Validation (favicon safety) ────────────────────────────────
// Only allow safe URL schemes for favicon injection
function isSafeFaviconUrl(url) {
  if (!url) return false;
  // Allow relative paths and https:// URLs only
  if (url.startsWith("/")) return true;
  if (url.startsWith("https://")) return true;
  if (url.startsWith("http://")) return true; // CDN URLs
  return false;
}

// ─── System Host Detection ──────────────────────────────────────────
const SYSTEM_SUBDOMAINS = new Set([
  "www", "app", "admin", "api", "dev", "staging", "mail", "ftp", "superadmin"
]);

function isMainPlatformHost(host) {
  if (!host) return true;
  const clean = host.split(":")[0].toLowerCase();

  // Main domain
  if (clean === "classgrid.in" || clean === "localhost" || clean === "127.0.0.1") return true;

  // System subdomains (superadmin.classgrid.in, api.classgrid.in, etc.)
  if (clean.endsWith(".classgrid.in")) {
    const prefix = clean.slice(0, -".classgrid.in".length);
    if (SYSTEM_SUBDOMAINS.has(prefix)) return true;
  }

  return false;
}

// ─── Active Domain Query Builder ────────────────────────────────────
function activeDomainQuery(field, host) {
  return {
    [`${field}.domain`]: host,
    [`${field}.status`]: { $in: ["verified", "active"] },
    [`${field}.is_enabled`]: { $ne: false },
  };
}

// ─── Extract Subdomain Slug ─────────────────────────────────────────
function extractSlugFromHost(host) {
  if (!host) return null;
  const clean = host.split(":")[0].toLowerCase();

  if (clean.endsWith(".classgrid.in")) {
    const prefix = clean.slice(0, -".classgrid.in".length);
    if (prefix && !prefix.includes(".") && !SYSTEM_SUBDOMAINS.has(prefix)) {
      return prefix;
    }
  }
  if (clean.endsWith(".localhost")) {
    const prefix = clean.slice(0, -".localhost".length);
    if (prefix && !prefix.includes(".") && !SYSTEM_SUBDOMAINS.has(prefix)) {
      return prefix;
    }
  }

  return null;
}

// ─── Main Branding Resolver ─────────────────────────────────────────
/**
 * Resolves tenant branding for the given hostname.
 *
 * @param {string} host - The request hostname (e.g., "home.quantumchem.site" or "nikhil.classgrid.in")
 * @returns {Object} { title, favicon, manifest, isMainPlatform, orgName }
 */
export async function getBrandingForHost(host) {
  const defaults = {
    title: "Classgrid ERP",
    favicon: "/logos/favicon-32x32.png?v=2",
    manifest: '<link rel="manifest" href="/site.webmanifest" />',
    isMainPlatform: true,
    orgName: null,
  };

  if (!host) return defaults;

  const cleanHost = host.split(":")[0].toLowerCase();

  // Main platform hosts get default Classgrid branding
  if (isMainPlatformHost(cleanHost)) {
    return defaults;
  }

  // Check cache first
  const cacheKey = cleanHost;
  const cached = getCachedBranding(cacheKey);
  if (cached) return cached;

  // Build query
  const slug = extractSlugFromHost(cleanHost);
  const query = [];
  if (slug) query.push({ subdomain: slug });
  // For custom/erp domains
  query.push(activeDomainQuery("custom_domain", cleanHost));
  query.push(activeDomainQuery("erp_domain", cleanHost));

  if (query.length === 0) {
    setCachedBranding(cacheKey, defaults);
    return defaults;
  }

  try {
    const org = await Organization.findOne({ $or: query })
      .select("site_title favicon_url name")
      .lean();

    if (!org) {
      // Unknown tenant — cache the miss to avoid repeated DB hits
      const result = { ...defaults, isMainPlatform: false };
      setCachedBranding(cacheKey, result);
      return result;
    }

    const result = {
      title: org.site_title || org.name || defaults.title,
      favicon: (org.favicon_url && isSafeFaviconUrl(org.favicon_url)) ? org.favicon_url : defaults.favicon,
      manifest: "", // Tenant domains don't get the Classgrid PWA manifest
      isMainPlatform: false,
      orgName: org.name || null,
    };

    setCachedBranding(cacheKey, result);
    return result;
  } catch (err) {
    console.error("[BrandingResolver] DB query failed:", err.message);
    return defaults;
  }
}

// ─── HTML Template Injection ────────────────────────────────────────
/**
 * Injects tenant branding into the HTML template using deterministic
 * placeholder replacement (not regex). Placeholders are:
 *   __TENANT_TITLE__     → escaped site_title
 *   __TENANT_FAVICON__   → escaped favicon URL
 *   __TENANT_MANIFEST__  → manifest link tag or empty string
 *   __TENANT_BOOTSTRAP__ → inline <script> with window.__CLASSGRID_TENANT__
 *
 * @param {string} template - The in-memory HTML template with placeholders
 * @param {Object} branding - Result from getBrandingForHost()
 * @returns {string} The final HTML ready to send
 */
export function injectBranding(template, branding) {
  const safeTitle = escapeHtml(branding.title);
  const safeFavicon = escapeAttr(branding.favicon);

  // Bootstrap payload: gives React instant access to tenant info
  // without waiting for an API call. Only non-secret, public data.
  const bootstrap = branding.isMainPlatform
    ? ""
    : `<script>window.__CLASSGRID_TENANT__=${JSON.stringify({
        title: branding.title,
        favicon: branding.favicon,
        orgName: branding.orgName,
      })};</script>`;

  return template
    .replace("__TENANT_TITLE__", safeTitle)
    .replace("__TENANT_FAVICON__", safeFavicon)
    .replace("__TENANT_MANIFEST__", branding.manifest)
    .replace("__TENANT_BOOTSTRAP__", bootstrap);
}
