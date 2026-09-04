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
          <span className="inline-flex size-9 items-center justify-center rounded-md border border-border bg-muted/40 text-muted-foreground">
            <Building2 className="size-4" />
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
          <Link to={`/superadmin/orgs/${row._id}`}>View Details</Link>
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
        <div className="flex items-center gap-2 mb-4 p-4">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, owner, plan..."
            className="flex h-9 w-full sm:w-[300px] items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>

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
