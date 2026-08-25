/**
 * Vercel Edge Middleware — Zero-Flash Tenant Branding
 *
 * Intercepts HTML page requests on Vercel, resolves the tenant from
 * the hostname via the Classgrid API, and injects org-specific
 * <title> and favicon into the HTML before the browser sees it.
 *
 * Flow:
 *   Browser → Vercel Edge → middleware.js → fetch branding from API
 *   → rewrite response with modified HTML → browser sees org branding instantly
 *
 * This is the same pattern used by Shopify, Notion, Atlassian.
 * Runs at the edge (Vercel's CDN), ~0ms latency for cached responses.
 */

const API_BASE = "https://api.classgrid.in";

// System subdomains that should always show Classgrid branding
const SYSTEM_SUBDOMAINS = new Set([
  "www", "app", "admin", "api", "dev", "staging", "mail", "superadmin"
]);

// In-memory branding cache (per edge instance)
const brandingCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function isMainPlatformHost(hostname) {
  const clean = hostname.split(":")[0].toLowerCase();
  if (clean === "classgrid.in" || clean === "localhost" || clean === "127.0.0.1") return true;
  if (clean.endsWith(".classgrid.in")) {
    const prefix = clean.slice(0, -".classgrid.in".length);
    if (SYSTEM_SUBDOMAINS.has(prefix)) return true;
  }
  return false;
}

function extractSlug(hostname) {
  const clean = hostname.split(":")[0].toLowerCase();
  if (clean.endsWith(".classgrid.in")) {
    const prefix = clean.slice(0, -".classgrid.in".length);
    if (prefix && !prefix.includes(".") && !SYSTEM_SUBDOMAINS.has(prefix)) {
      return prefix;
    }
  }
  return null;
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function fetchBranding(hostname) {
  // Check cache
  const cached = brandingCache.get(hostname);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.branding;
  }

  try {
    const slug = extractSlug(hostname);
    const query = slug
      ? `slug=${encodeURIComponent(slug)}`
      : `domain=${encodeURIComponent(hostname)}`;

    const res = await fetch(`${API_BASE}/api/public/auth-branding?type=institution&${query}`, {
      headers: { "Accept": "application/json" },
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (!data.success || !data.branding) return null;

    const b = data.branding;
    const branding = {
      title: b.siteTitle || b.shortName || b.name || null,
      favicon: b.faviconUrl || null,
    };

    // Cache the result
    brandingCache.set(hostname, { branding, timestamp: Date.now() });

    // Evict old entries if cache grows too large
    if (brandingCache.size > 500) {
      const firstKey = brandingCache.keys().next().value;
      brandingCache.delete(firstKey);
    }

    return branding;
  } catch (err) {
    console.error("[Middleware] Branding fetch failed:", err.message);
    return null;
  }
}

export const config = {
  matcher: [
    // Match all page requests, exclude static assets and API calls
    "/((?!api|_next|_vercel|assets|logos|site\\.webmanifest|favicon|robots\\.txt|sitemap).*)",
  ],
};

export default async function middleware(request) {
  const url = new URL(request.url);
  const hostname = request.headers.get("host") || url.hostname;

  // Skip non-HTML requests (JS, CSS, images, fonts, etc.)
  const ext = url.pathname.split(".").pop()?.toLowerCase();
  const staticExtensions = new Set([
    "js", "css", "png", "jpg", "jpeg", "gif", "svg", "ico", "woff", "woff2",
    "ttf", "eot", "webp", "mp4", "webm", "map", "json", "xml", "txt"
  ]);
  if (ext && staticExtensions.has(ext)) {
    return; // Let Vercel serve static files normally
  }

  // Main platform hosts get default branding — no modification needed
  if (isMainPlatformHost(hostname)) {
    return; // Serve index.html as-is with Classgrid branding
  }

  // Fetch tenant branding from the API
  const branding = await fetchBranding(hostname);
  if (!branding || (!branding.title && !branding.favicon)) {
    return; // No branding found, serve default
  }

  // Fetch the index.html from Vercel's own static hosting
  // Use the internal URL with x-middleware-next to avoid infinite loop
  const originUrl = new URL("/index.html", request.url);
  const originResponse = await fetch(originUrl.toString(), {
    headers: {
      // Pass through essential headers but NOT the host header
      "accept": "text/html",
      "x-middleware-subrequest": "1", // Prevent middleware re-entry
    },
  });

  if (!originResponse.ok) {
    return; // Fallback to default behavior
  }

  let html = await originResponse.text();

  // Inject tenant branding
  if (branding.title) {
    const safeTitle = escapeHtml(branding.title);
    html = html.replace(/<title>.*?<\/title>/, `<title>${safeTitle}</title>`);
  }

  if (branding.favicon) {
    const safeFavicon = escapeHtml(branding.favicon);
    html = html.replace(
      /<link id="favicon-link"[^>]*\/>/,
      `<link id="favicon-link" rel="icon" href="${safeFavicon}" />`
    );
  }

  // Remove PWA manifest for tenant domains
  html = html.replace(/<link rel="manifest"[^>]*\/>/, "");

  // Inject bootstrap payload so React knows the tenant instantly
  const bootstrap = `<script>window.__CLASSGRID_TENANT__=${JSON.stringify({
    title: branding.title,
    favicon: branding.favicon,
  })};</script>`;
  html = html.replace("</head>", `${bootstrap}\n</head>`);

  // Return modified HTML with proper headers
  return new Response(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "private, no-cache, no-store, max-age=0",
      "vary": "Host",
    },
  });
}
