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

import React from "react";
import { Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { Switch } from "@/components/marketing_ui/switch";

export function SettingsAppearanceCard() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm mb-6">
      <div className="p-5 border-b border-border">
        <h2 className="text-lg font-bold flex items-center gap-2 text-foreground">
          <Moon size={18} className="text-foreground" /> Appearance
        </h2>
        <p className="text-sm text-muted-foreground mt-1">Customize how Classgrid looks on your device.</p>
      </div>
      
      <div className="flex items-center justify-between p-5">
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-sm text-foreground">Dark Mode</span>
          <span className="text-xs text-muted-foreground">Enable dark theme for the dashboard</span>
        </div>
        <Switch 
          checked={resolvedTheme === "dark"} 
          onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")} 
        />
      </div>
    </div>
  );
}
