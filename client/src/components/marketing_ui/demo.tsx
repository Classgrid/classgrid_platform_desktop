"use client";

/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */


import IntroAnimation from "@/components/marketing_ui/scroll-morph-hero";

export default function Demo() {
    return (
        <div className="relative h-[800px] w-full overflow-hidden rounded-lg border">
            <IntroAnimation />
        </div>
    );
}