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



import { Calendar, Clock, Info, ShieldCheck, Target } from "lucide-react";
import { Card, CardContent } from "@/components/marketing_ui/card";
import { Badge } from "@/components/marketing_ui/badge";
import { cn } from "@/lib/utils";

type PageMetadataBoxProps = {
  updatedAt?: string;
  category?: string;
  availableFor?: string[];
  className?: string;
};

export function PageMetadataBox({
  updatedAt,
  category,
  availableFor = [],
  className,
}: PageMetadataBoxProps) {
  return (
    <Card className={cn("mb-12 border-border/60 bg-card/40 backdrop-blur-sm overflow-hidden", className)}>
      <CardContent className="grid gap-6 p-6 sm:grid-cols-2">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/10 text-emerald-500 text-[10px] uppercase tracking-wider font-bold">
              <Info className="mr-1.5 h-3 w-3" />
              Page Metadata
            </Badge>
          </div>
          
          <div className="space-y-2.5">
            {category && (
              <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <Target className="h-4 w-4 text-emerald-500/70" />
                <span className="font-medium text-foreground/80">Category:</span>
                <span className="text-foreground capitalize">{category}</span>
              </div>
            )}
          </div>
        </div>

        {availableFor && availableFor.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/10 text-emerald-500 text-[10px] uppercase tracking-wider font-bold">
                <ShieldCheck className="mr-1.5 h-3 w-3" />
                Availability
              </Badge>
            </div>
            
            <div className="flex flex-wrap gap-1.5">
              {availableFor.map((item) => (
                <span 
                  key={item} 
                  className="rounded-md border border-border bg-background/50 px-2 py-1 text-[11px] font-medium text-muted-foreground"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
