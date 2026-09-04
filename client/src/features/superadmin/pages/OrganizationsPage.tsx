import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Building2, Plus, RefreshCw, Search, ShieldCheck, Users } from "lucide-react";
import { Link } from "react-router-dom";


import { SectionPanel } from "@/components/marketing_ui/SectionPanel";
import { DataTable } from "@/components/marketing_ui/data-table";
import { formatOrgType } from "@/utils/orgHelpers";
import { Button } from "@/components/marketing_ui/button";
import { Badge } from "@/components/marketing_ui/badge";
import { StatCard } from "@/components/marketing_ui/StatCard";
import { Input } from "@/components/marketing_ui/input";
import { SuperadminFilterBar } from "../components/SuperadminFilterBar";
import { ResponsiveSelect } from "@/components/marketing_ui/responsive-select";


import { formatDate } from "@/utils/dateUtils";

import { dashboardApi, type SuperAdminOrganization } from "../services/superAdminApi";
import { RefreshButton } from "@/components/marketing_ui/refresh-button";


const statusVariant = (status?: string) => {
  if (status === "active") return "success";
  if (status === "suspended" || status === "blocked") return "danger";
  return "warning";
};

export function OrganizationsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["superadmin-all-orgs"],
    queryFn: dashboardApi.getOrganizations,
    staleTime: 60_000,
    retry: 1,
  });

  const allOrgs = data?.data || [];
  const filteredOrgs = useMemo(() => {
    let result = allOrgs;
    if (statusFilter) {
      result = result.filter(o => o.status === statusFilter);
    }
    const q = search.trim().toLowerCase();
    if (!q) return result;

    return result.filter((o) =>
      [o.name, o.ownerEmail, o.ownerName, formatOrgType(o.orgType), o.status, o.plan]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }, [allOrgs, search, statusFilter]);

  const stats = useMemo(() => {
    const totalUsers = allOrgs.reduce((sum, org) => sum + (org.userCount ?? 0), 0);
    return {
      total: allOrgs.length,
      active: allOrgs.filter((org) => org.status === "active").length,
      suspended: allOrgs.filter((org) => org.status === "suspended" || org.status === "blocked").length,
      totalUsers,
    };
  }, [allOrgs]);

  const columns = [
    {
      header: "Organization Name",
      key: "name",
      render: (_val: any, row: any) => (
        <div className="flex items-center gap-3">
          <span className="inline-flex size-9 items-center justify-center rounded-md border border-border bg-muted/40 text-muted-foreground overflow-hidden">
            {row.logo_url || row.logoUrl ? (
              <img src={row.logo_url || row.logoUrl} alt={row.name} className="w-full h-full object-cover" />
            ) : (
              <Building2 className="size-4" />
            )}
          </span>
          <div>
            <div className="font-medium text-foreground">{row.name}</div>
            <div className="text-xs capitalize text-muted-foreground">
              {formatOrgType(row.orgType)}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: "Owner",
      key: "ownerEmail",
      render: (_val: any, row: any) => (
        <div>
          <div className="font-medium text-foreground">{row.ownerName || "Owner not set"}</div>
          <div className="text-xs text-muted-foreground">{row.ownerEmail || "No owner email"}</div>
        </div>
      ),
    },
    {
      header: "Status",
      key: "status",
      render: (_val: any, row: any) => (
        <Badge variant={statusVariant(row.status)} dot>
          {row.status}
        </Badge>
      ),
    },
    {
      header: "Users",
      key: "userCount",
      render: (_val: any, row: any) => <span className="font-medium tabular-nums">{row.userCount ?? 0}</span>,
    },
    {
      header: "Joined",
      key: "createdAt",
      render: (_val: any, row: any) => (
        <span className="text-sm">
          {formatDate(row.createdAt)}
        </span>
      ),
    },
    {
      header: "Actions",
      key: "actions",
      render: (_val: any, row: any) => (
        <Button size="sm" variant="outline" asChild>
          <Link to={`/superadmin/detail/${row.subdomain || row.name || "unknown"}`} state={{ orgId: row._id }}>
            View Details
          </Link>
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div
        title="Organizations Directory"
        description="Live organization records from the Classgrid backend, including owner, status, and user counts."
        actions={
          <>
            <RefreshButton onClick={() => refetch()} isFetching={isFetching} />
            <Button asChild>
              <Link to="/superadmin/onboard">
                <Plus className="size-4" />
                Onboard New Org
              </Link>
            </Button>
          </>
        }
      />

      <SectionPanel
        title="Organizations"
        description="Search, inspect, and manage provisioned institutions."
        noPadding
      >
        <SuperadminFilterBar
          searchQuery={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search name, owner, plan..."
        >
          <div className="w-[150px]">
            <ResponsiveSelect
              className="flex h-9 w-full items-center rounded-md border border-border bg-transparent px-3 py-1 shadow-sm hover:bg-accent/50 transition-colors text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Status: All</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="blocked">Blocked</option>
            </ResponsiveSelect>
          </div>
        </SuperadminFilterBar>

        {isError ? (
          <div className="p-4 m-4 rounded-md border bg-red-100 text-red-800 border-red-200">
            <span className="font-semibold block mb-1">Backend request failed</span>
            <p className="text-sm mb-3">
              {(error as Error)?.message || "The organizations endpoint did not return data."}
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : null}

        <DataTable
          columns={columns}
          rows={filteredOrgs}
          isLoading={isLoading}
          emptyMessage={allOrgs.length ? "No organizations match your search." : "No organizations found."}
        />
      </SectionPanel>
    </div>
  );
}
