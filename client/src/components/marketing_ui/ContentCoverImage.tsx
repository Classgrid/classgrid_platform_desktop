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

// import Image from "next/image";
import { cn } from "@/lib/utils";

type ContentCoverImageProps = {
  src: string;
  alt: string;
  priority?: boolean;
  className?: string;
};

export function ContentCoverImage({ 
  src, 
  alt, 
  priority = false, 
  className 
}: ContentCoverImageProps) {
  return (
    <div 
      className={cn(
        "relative w-full aspect-video max-h-[480px] rounded-2xl overflow-hidden border border-border bg-card/30 flex items-center justify-center",
        className
      )}
    >
      <img 
        src={src} 
        alt={alt || "Cover image"} 
        className="object-contain w-full h-full" 
      />
    </div>
  );
}
