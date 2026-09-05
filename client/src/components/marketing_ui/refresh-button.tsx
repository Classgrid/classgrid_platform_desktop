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
import { RefreshCw } from "lucide-react";
import { Button, ButtonProps } from "@/components/marketing_ui/button";
import { Spinner } from "@/components/marketing_ui/spinner";
import { cn } from "@/lib/utils";

export interface RefreshButtonProps extends Omit<ButtonProps, "children"> {
  isFetching?: boolean;
  label?: React.ReactNode;
}

export function RefreshButton({
  isFetching = false,
  label = "Refresh",
  className,
  disabled,
  ...props
}: RefreshButtonProps) {
  return (
    <Button
      variant="outline"
      disabled={isFetching || disabled}
      className={cn("gap-2", className)}
      {...props}
    >
      {isFetching ? (
        <Spinner className="w-4 h-4" />
      ) : (
        <RefreshCw className="w-4 h-4" />
      )}
      {label && <span>{label}</span>}
    </Button>
  );
}
