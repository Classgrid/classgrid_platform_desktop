/**
 * tenant-bootstrap.ts
 *
 * Reads the tenant branding injected by Vercel Edge Middleware into
 * window.__CLASSGRID_TENANT__. This data is available BEFORE React
 * even starts, making it the fastest possible way to know the tenant.
 *
 * Usage in login pages:
 *   const boot = getBootstrappedTenant();
 *   if (boot) {
 *     document.title = boot.title;
 *     // Skip the auth-branding API call for title/favicon
 *   }
 */

interface TenantBootstrap {
  title: string | null;
  favicon: string | null;
}

/**
 * Returns the tenant branding injected by Edge Middleware, or null
 * if not available (main platform, dev mode, or middleware didn't run).
 */
export function getBootstrappedTenant(): TenantBootstrap | null {
  try {
    const tenant = (window as any).__CLASSGRID_TENANT__;
    if (tenant && typeof tenant === "object" && (tenant.title || tenant.favicon)) {
      return tenant as TenantBootstrap;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Applies bootstrapped branding to the document immediately.
 * Call this at the top of login/auth pages BEFORE any async work.
 * Returns true if bootstrap was applied, false if fallback API call is needed.
 */
export function applyBootstrappedBranding(): boolean {
  const tenant = getBootstrappedTenant();
  if (!tenant) return false;

  if (tenant.title) {
    document.title = tenant.title;
  }

  if (tenant.favicon) {
    const link = document.getElementById("favicon-link") as HTMLLinkElement | null;
    if (link) {
      link.href = tenant.favicon;
    }
  }

  return true;
}
