"use client";

/*
 * ─────────────────────────────────────────────────────────
 * 🚨 HOSTING & ARCHITECTURE RULE 🚨
 * 1. BACKEND IS HOSTED ON AWS EC2 AT API.CLASSGRID.IN
 * 2. FRONTEND IS HOSTED ON VERCEL
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
 * 🚨 CRITICAL AI AND SYSTEM RULES 🚨
 * 1. NEVER DELETE ANY ENVIRONMENT VARIABLES.
 * 2. LOCALHOST TESTING IS STRICTLY BANNED. NO AI WILL EVER TRY TO WORK LOCALLY.
 * 3. THIS REPO IS PRODUCTION-FIRST. DO NOT TOUCH OR REMOVE KEYS.
 * ─────────────────────────────────────────────────────────
 */

/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */


import { useTheme } from "next-themes";
import { useEffect, useState, type ReactNode } from "react";

/**
 * Global Theme Wrapper Components
 * ================================
 * Use ONLY for theme-specific visual ASSETS (logos, images).
 * DO NOT use for layout or text — those should use semantic tokens
 * (bg-background, text-foreground, etc.) which auto-switch.
 *
 * Usage:
 *   <LightOnly><img src="/logo-dark.svg" /></LightOnly>
 *   <DarkOnly><img src="/logo-light.svg" /></DarkOnly>
 */

function useIsMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

/**
 * Renders children ONLY in Light Mode.
 * Hidden in Dark Mode. Prevents hydration mismatch.
 */
export function LightOnly({ children }: { children: ReactNode }) {
  const mounted = useIsMounted();
  const { resolvedTheme } = useTheme();

  if (!mounted) return null;
  if (resolvedTheme === "dark") return null;

  return <>{children}</>;
}

/**
 * Renders children ONLY in Dark Mode.
 * Hidden in Light Mode. Prevents hydration mismatch.
 */
export function DarkOnly({ children }: { children: ReactNode }) {
  const mounted = useIsMounted();
  const { resolvedTheme } = useTheme();

  if (!mounted) return null;
  if (resolvedTheme !== "dark") return null;

  return <>{children}</>;
}
