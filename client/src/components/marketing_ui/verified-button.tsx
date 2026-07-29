import * as React from "react";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface VerifiedButtonProps {
  className?: string;
  text?: string;
}

export function VerifiedButton({ className, text = "Verified" }: VerifiedButtonProps) {
  return (
    <div 
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-6 py-2 text-sm font-medium text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-900/20 dark:text-emerald-400 select-none",
        className
      )}
    >
      <CheckCircle2 className="h-4 w-4" />
      {text}
    </div>
  );
}
