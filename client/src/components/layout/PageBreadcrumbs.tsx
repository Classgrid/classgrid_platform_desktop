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

import { useEffect } from 'react';
import { useBreadcrumbStore } from '@/store/useBreadcrumbStore';

interface PageBreadcrumbsProps {
  items: { label: string; href?: string }[];
  show?: boolean;
}

export function PageBreadcrumbs({ items, show = true }: PageBreadcrumbsProps) {
  const { setBreadcrumbs, setShowBreadcrumbs } = useBreadcrumbStore();

  useEffect(() => {
    setBreadcrumbs(items);
    setShowBreadcrumbs(show);
    
    return () => {
      // Revert to empty/default on unmount
      setBreadcrumbs([]);
      setShowBreadcrumbs(true);
    };
  }, [items, show, setBreadcrumbs, setShowBreadcrumbs]);

  return null; // This component doesn't render anything directly
}
