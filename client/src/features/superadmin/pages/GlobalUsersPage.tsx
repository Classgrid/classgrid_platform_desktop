import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Users, Search } from "lucide-react";

import { Card, CardContent } from "@/components/marketing_ui/card";
import { DataTable } from "@/components/marketing_ui/data-table";
import { Badge } from "@/components/marketing_ui/badge";
import { Input } from "@/components/marketing_ui/input";
import { ResponsiveSelect } from "@/components/marketing_ui/responsive-select";
import { RefreshButton } from "@/components/marketing_ui/refresh-button";
import { NikhilTimeCalendar } from "@/components/marketing_ui/nikhil_time_calendar";

import { apiClient } from "@/lib/apiClient";
import { formatDate } from "@/utils/dateUtils";

// ── Types & Constants ────────────────────────────────────────────────────────

const ROLE_OPTIONS = [
  { label: "All Roles", value: "" },
  { label: "Student", value: "student" },
  { label: "Faculty", value: "faculty" },
  { label: "Org Admin", value: "org_admin" },
  { label: "Super Admin", value: "super_admin" },
  { label: "Principal", value: "principal" },
  { label: "HOD", value: "hod" },
];

const ORG_TYPE_OPTIONS = [
  { label: "All Org Types", value: "" },
  { label: "Engineering", value: "engineering" },
  { label: "School", value: "school" },
  { label: "Junior College", value: "junior_college" },
  { label: "Coaching", value: "coaching" },
  { label: "Diploma", value: "diploma" },
  { label: "Other", value: "other" },
];

const STATUS_OPTIONS = [
  { label: "All Statuses", value: "" },
  { label: "Active", value: "active" },
  { label: "Suspended", value: "suspended" },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function GlobalUsersPage() {
  const navigate = useNavigate();
  
  // Filters state
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [orgTypeFilter, setOrgTypeFilter] = useState("");
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);

  // Fetch users from our newly enriched API
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["global-users", search, roleFilter, statusFilter],
    queryFn: () => apiClient.get<any>("/api/super-admin/users", { 
        params: { 
            q: search, 
            role: roleFilter || undefined, 
            status: statusFilter || undefined, 
            limit: 200 
        } 
    }).then(r => r.data),
    staleTime: 30_000,
  });

  const allUsers: any[] = data?.data ?? [];
  const total: number = data?.total ?? 0;

  // Client-side filtering for Org Type & Date (since API doesn't filter them natively yet)
  const filteredUsers = useMemo(() => {
    return allUsers.filter(u => {
        if (orgTypeFilter && u.orgType !== orgTypeFilter) return false;
        
        if (dateFilter) {
            const joinedDate = new Date(u.createdAt);
            // Simple date match by Day/Month/Year
            if (joinedDate.toDateString() !== dateFilter.toDateString()) {
                return false;
            }
        }
        return true;
    });
  }, [allUsers, orgTypeFilter, dateFilter]);

  // Table Columns
  const columns = useMemo(() => [
    {
      key: "user",
      header: "User",
      width: "w-full min-w-[220px]",
      render: (_: any, u: any) => (
        <div className="flex items-center gap-3 py-1">
          {u.profilePicture ? (
            <img src={u.profilePicture} alt={u.name} className="h-8 w-8 rounded-full object-cover border border-border flex-shrink-0" />
          ) : (
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-xs">
              {u.name?.substring(0, 2).toUpperCase() || "??"}
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <span className="font-medium text-sm text-foreground truncate transition-colors">{u.name}</span>
            <span className="text-muted-foreground text-xs truncate">{u.email}</span>
          </div>
        </div>
      )
    },
    {
      key: "status",
      header: "Status",
      width: "w-[120px]",
      render: (_: any, u: any) => {
        const s = u.status ?? "active";
        return (
          <Badge variant={s === "active" ? "success" : "danger"} dot>
            {s === "active" ? "Ready" : "Suspended"}
          </Badge>
        );
      }
    },
    {
      key: "role",
      header: "Role",
      width: "w-[150px]",
      render: (_: any, u: any) => {
        const r = u.role ?? "user";
        return (
          <Badge variant={r.includes("admin") ? "danger" : r === "faculty" ? "warning" : "info"} className="whitespace-nowrap">
            {r.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
          </Badge>
        );
      }
    },
    {
      key: "organizationName",
      header: "Organization",
      width: "w-[200px]",
      render: (_: any, u: any) => (
        <div className="flex items-center gap-2 max-w-[200px]">
          {u.organizationLogo ? (
            <img src={u.organizationLogo} alt="org" className="h-5 w-5 rounded object-cover flex-shrink-0" />
          ) : (
             <div className="h-5 w-5 rounded bg-muted/50 border border-border flex-shrink-0" />
          )}
          <span className="text-sm font-medium text-muted-foreground truncate">{u.organizationName || "Platform User"}</span>
        </div>
      )
    },
    {
      key: "joined",
      header: "Joined",
      width: "w-[130px]",
      render: (_: any, u: any) => (
        <span className="text-sm text-muted-foreground flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
            {formatDate(u.createdAt)}
        </span>
      )
    }
  ], []);

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1200px] mx-auto p-4 sm:p-6 lg:p-8 pb-12">
      
      <Card className="border-border shadow-sm overflow-hidden bg-background">
        
        {/* Vercel-style Filter Bar */}
        <div className="flex flex-wrap items-center gap-3 p-4 border-b border-border bg-muted/10">
            <div className="w-full sm:w-[220px]">
                <NikhilTimeCalendar 
                    value={dateFilter} 
                    onChange={setDateFilter} 
                    placeholder="Select Date" 
                    className="h-9 w-full bg-background" 
                />
            </div>
            <div className="relative w-full sm:w-[240px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input 
                    className="pl-8 h-9 w-full bg-background border-border text-sm" 
                    placeholder="Search by name or email..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            <div className="w-full sm:w-auto">
                <ResponsiveSelect
                    className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground focus-visible:outline-none min-w-[140px]"
                    value={orgTypeFilter}
                    onChange={(e) => setOrgTypeFilter(e.target.value)}
                >
                    {ORG_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </ResponsiveSelect>
            </div>
            <div className="w-full sm:w-auto">
                <ResponsiveSelect
                    className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground focus-visible:outline-none min-w-[140px]"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                >
                    {ROLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </ResponsiveSelect>
            </div>
            <div className="w-full sm:w-auto">
                <ResponsiveSelect
                    className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground focus-visible:outline-none min-w-[140px]"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </ResponsiveSelect>
            </div>
            <div className="w-full sm:w-auto ml-auto">
                <RefreshButton onClick={() => refetch()} isFetching={isFetching} />
            </div>
        </div>

        {/* Data Table */}
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            rows={filteredUsers}
            isLoading={isLoading}
            onRowClick={(row) => navigate(`/superadmin/global-users/${row._id}`)}
            emptyMessage={search ? "No users found matching your search." : "No users found."}
            className="border-none rounded-none group"
          />
        </CardContent>
      </Card>
      
      {/* Footer Stats Summary */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Showing {filteredUsers.length} of {total} total users</span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-success"></span> All systems operational
          </span>
      </div>

    </div>
  );
}
