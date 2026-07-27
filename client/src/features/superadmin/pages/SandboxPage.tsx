import React, { useState } from 'react';
import { ResponsiveSelect } from "@/components/marketing_ui/responsive-select";
import { NikhilTimeCalendar } from "@/components/marketing_ui/nikhil_time_calendar";
import { Search, X } from "lucide-react";

export function SandboxPage() {
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [statusFilter, setStatusFilter] = useState("");
  const [orgTypeFilter, setOrgTypeFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen p-8 lg:p-12">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Filter Bar Sandbox</h1>
      <p className="text-sm text-muted-foreground mb-6">All filters on ONE line — no wrapping</p>

      {/* ═══ ALL ON ONE LINE — NO WRAP ═══ */}
      <div className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-2">
        {/* NikhilTimeCalendar — Start */}
        <div className="w-[200px] shrink-0">
          <NikhilTimeCalendar
            value={dateFrom}
            onChange={setDateFrom}
            placeholder="Start date"
            popDirection="down"
            className="h-9 text-xs"
          />
        </div>

        <span className="text-xs text-muted-foreground shrink-0">–</span>

        {/* NikhilTimeCalendar — End */}
        <div className="w-[200px] shrink-0">
          <NikhilTimeCalendar
            value={dateTo}
            onChange={setDateTo}
            placeholder="End date"
            popDirection="down"
            className="h-9 text-xs"
          />
        </div>

        {(dateFrom || dateTo) && (
          <button
            onClick={() => { setDateFrom(undefined); setDateTo(undefined); }}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <X size={14} />
          </button>
        )}

        {/* Search */}
        <div className="relative w-[220px] shrink-0">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Name, email, ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex h-9 w-full items-center rounded-md border border-input bg-transparent pl-9 pr-8 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring placeholder:text-muted-foreground"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Org Type */}
        <ResponsiveSelect
          className="flex h-9 w-[140px] shrink-0 items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
          className="flex h-9 w-[140px] shrink-0 items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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

      {/* Show active filters */}
      <div className="mt-6 p-4 bg-card border border-border rounded-lg text-sm text-muted-foreground space-y-1">
        <p><strong>dateFrom:</strong> {dateFrom?.toLocaleString() || "—"}</p>
        <p><strong>dateTo:</strong> {dateTo?.toLocaleString() || "—"}</p>
        <p><strong>search:</strong> {searchQuery || "—"}</p>
        <p><strong>orgType:</strong> {orgTypeFilter || "—"}</p>
        <p><strong>status:</strong> {statusFilter || "—"}</p>
      </div>
    </div>
  );
}
