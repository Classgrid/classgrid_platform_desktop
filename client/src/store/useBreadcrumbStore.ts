/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

import { create } from 'zustand';

interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface BreadcrumbState {
  items: BreadcrumbItem[];
  showBreadcrumbs: boolean;
  setBreadcrumbs: (items: BreadcrumbItem[]) => void;
  setShowBreadcrumbs: (show: boolean) => void;
}

export const useBreadcrumbStore = create<BreadcrumbState>((set) => ({
  items: [],
  showBreadcrumbs: true,
  setBreadcrumbs: (items) => set({ items, showBreadcrumbs: true }),
  setShowBreadcrumbs: (show) => set({ showBreadcrumbs: show }),
}));
