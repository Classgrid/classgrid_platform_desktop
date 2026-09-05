/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

import React from "react";
import { Search, X } from "lucide-react";

export interface SuperadminFilterBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  children?: React.ReactNode;
}

export function SuperadminFilterBar({
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Search...",
  children,
}: SuperadminFilterBarProps) {
  return (
    <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-3 mb-6">
      {/* Search Input */}
      <div className="relative w-full xl:w-[240px] shrink-0">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full h-9 pl-10 pr-10 rounded-md border border-border bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all shadow-sm"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Dynamic Filters (Dropdowns & Date Pickers) */}
      {children && (
        <div className="flex flex-row flex-wrap xl:flex-nowrap gap-2 shrink-0">
          {children}
        </div>
      )}
    </div>
  );
}
