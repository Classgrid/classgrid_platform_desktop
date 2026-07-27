import React, { useState } from 'react';
import { ResponsiveSelect } from "@/components/marketing_ui/responsive-select";
import { NikhilTimeCalendar } from "@/components/marketing_ui/nikhil_time_calendar";
import { Search, X } from "lucide-react";

export function SandboxPage() {
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [statusFilter, setStatusFilter] = useState("");
  const [orgTypeFilter, setOrgTypeFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen p-8 lg:p-12">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Filter Bar Sandbox</h1>

      {/* ═══ ONE LINE — tight like Vercel, scales to fit screen, no scrollbar ═══ */}
      <div className="flex items-center gap-1.5 w-full max-w-full">
        {/* Date Range — ONE button using NikhilTimeCalendar mode="range" */}
        <div className="min-w-[180px] max-w-[220px] flex-1">
          <NikhilTimeCalendar
            mode="range"
            startValue={startDate}
            endValue={endDate}
            onRangeApply={(start, end) => { setStartDate(start); setEndDate(end); }}
            placeholder="Select Date Range"
            popDirection="down"
            className="h-8 text-xs w-full"
          />
        </div>

        {(startDate || endDate) && (
          <button
            onClick={() => { setStartDate(undefined); setEndDate(undefined); }}
            className="p-0.5 text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <X size={12} />
          </button>
        )}

        {/* Search */}
        <div className="relative min-w-[150px] flex-[2]">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex h-8 w-full items-center rounded-md border border-input bg-transparent pl-8 pr-7 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring placeholder:text-muted-foreground"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X size={12} />
            </button>
          )}
        </div>

        {/* Org Type */}
        <ResponsiveSelect
          className="flex h-8 w-[110px] shrink-0 items-center justify-between rounded-md border border-input bg-transparent px-2.5 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          value={orgTypeFilter}
          onChange={(e) => setOrgTypeFilter(e.target.value)}
        >
          <option value="">Org Type: All</option>
          <option value="college">College</option>
          <option value="school">School</option>
          <option value="coaching">Coaching</option>
        </ResponsiveSelect>

        {/* Status */}
        <ResponsiveSelect
          className="flex h-8 w-[100px] shrink-0 items-center justify-between rounded-md border border-input bg-transparent px-2.5 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Status: All</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </ResponsiveSelect>
      </div>
    </div>
  );
}
