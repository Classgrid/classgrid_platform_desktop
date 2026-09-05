"use client";

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


import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { RoleDataMap } from "./radial-orbital-timeline";

const RadialOrbitalTimeline = dynamic(() => import("./radial-orbital-timeline"), { ssr: false });

type RadialOrbitalTimelineWrapperProps = {
  rings: string[][];
  activeTab: string;
  roleDataMap?: RoleDataMap;
};

export default function RadialOrbitalTimelineWrapper({ rings, activeTab, roleDataMap }: RadialOrbitalTimelineWrapperProps) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) return <div className="mx-auto w-full max-w-[850px] h-[500px] bg-background/5 animate-pulse rounded-3xl" />;
  
  return <RadialOrbitalTimeline rings={rings} activeTab={activeTab} roleDataMap={roleDataMap} />;
}
