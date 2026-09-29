import React, { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/marketing_ui/card";
import { PageBreadcrumbs } from "@/components/layout/PageBreadcrumbs";
import { 
  Building, 
  Users, 
  Database,
  Cpu,
  ChevronRight,
  Home,
  Shield,
  Activity,
  User as UserIcon,
  HardDrive
} from "lucide-react";
import { 
  useGlobalAiStats, 
  useAiUsageOrgs, 
  useAiOrgDetail, 
  useAiOrgUsers,
  useAiUserDetail
} from "../queries/useAiUsage";
import { Skeleton } from "@/components/marketing_ui/skeleton";
import { formatNumber } from "@/lib/utils";
import { AiUserDetailPanel } from "../components/ai-usage/AiUserDetailPanel";

interface PathState {
  orgId?: string;
  orgName?: string;
  role?: string;
  userId?: string;
  userName?: string;
}

const FolderIcon = ({ label, subtitle, onClick, badge, icon: Icon = Building }: any) => (
  <button 
    onClick={onClick}
    className="flex flex-col items-center justify-start p-4 rounded-xl hover:bg-accent/50 transition-colors border border-transparent hover:border-border group h-auto min-h-[160px] relative cursor-pointer"
  >
    <div className="relative mb-2">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor" className="text-amber-400 group-hover:text-amber-500 transition-colors drop-shadow-sm">
        <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
      </svg>
      {badge > 0 && (
        <div className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm min-w-[20px] text-center">
          {badge}
        </div>
      )}
      <div className="absolute inset-0 flex items-center justify-center pt-2">
        <Icon className="w-6 h-6 text-amber-100 opacity-60" />
      </div>
    </div>
    <div className="flex flex-col w-full justify-center mt-2">
      <span className="text-sm font-medium text-foreground whitespace-normal break-normal w-full text-center leading-tight px-1 text-balance">{label}</span>
      {subtitle && <span className="text-xs text-muted-foreground whitespace-normal break-words w-full text-center mt-1 px-1 text-balance">{subtitle}</span>}
    </div>
  </button>
);

export function AiUsageDashboardPage() {
  const [path, setPath] = useState<PathState>({});

  const { data: globalStats, isLoading: globalLoading } = useGlobalAiStats();
  const { data: orgs, isLoading: orgsLoading } = useAiUsageOrgs();

  // Queries for deeper levels are enabled only when we have the right path state
  const { data: orgDetail, isLoading: orgDetailLoading } = useAiOrgDetail(path.orgId || "");
  const { data: orgUsers, isLoading: orgUsersLoading } = useAiOrgUsers(path.orgId || "");
  const { data: userDetail, isLoading: userDetailLoading } = useAiUserDetail(path.userId || "");

  const handleNavigateUp = (level: "root" | "org" | "role") => {
    if (level === "root") setPath({});
    else if (level === "org") setPath({ orgId: path.orgId, orgName: path.orgName });
    else if (level === "role") setPath({ orgId: path.orgId, orgName: path.orgName, role: path.role });
  };

  const renderBreadcrumbs = () => {
    return (
      <div className="flex items-center text-sm text-muted-foreground mb-6 bg-muted/30 p-2 rounded-lg w-fit border border-border/50">
        <button 
          onClick={() => handleNavigateUp("root")}
          className={`flex items-center hover:text-foreground transition-colors px-2 py-1 rounded-md ${!path.orgId ? "bg-background shadow-sm text-foreground" : ""}`}
        >
          <Home className="h-4 w-4 mr-1.5" /> All Organizations
        </button>
        
        {path.orgId && (
          <>
            <ChevronRight className="h-4 w-4 mx-1 opacity-50" />
            <button 
              onClick={() => handleNavigateUp("org")}
              className={`flex items-center hover:text-foreground transition-colors px-2 py-1 rounded-md ${!path.role ? "bg-background shadow-sm text-foreground" : ""}`}
            >
              <Building className="h-4 w-4 mr-1.5" /> {path.orgName}
            </button>
          </>
        )}

        {path.role && (
          <>
            <ChevronRight className="h-4 w-4 mx-1 opacity-50" />
            <button 
              onClick={() => handleNavigateUp("role")}
              className={`flex items-center hover:text-foreground transition-colors px-2 py-1 rounded-md ${!path.userId ? "bg-background shadow-sm text-foreground" : ""}`}
            >
              <Shield className="h-4 w-4 mr-1.5" /> {path.role}
            </button>
          </>
        )}

        {path.userId && (
          <>
            <ChevronRight className="h-4 w-4 mx-1 opacity-50" />
            <div className="flex items-center bg-background shadow-sm text-foreground px-2 py-1 rounded-md">
              <UserIcon className="h-4 w-4 mr-1.5" /> {path.userName}
            </div>
          </>
        )}
      </div>
    );
  };

  const renderGlobalStats = () => {
    if (globalLoading) return <Skeleton className="h-32 w-full mb-8" />;
    if (!globalStats) return null;

    return (
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardContent className="p-6 flex flex-col items-center text-center">
            <Cpu className="h-8 w-8 text-blue-500 mb-3" />
            <div className="text-3xl font-bold">{formatNumber(globalStats.totalTokensConsumed)}</div>
            <div className="text-sm text-muted-foreground mt-1">Total Tokens Used</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex flex-col items-center text-center">
            <Database className="h-8 w-8 text-indigo-500 mb-3" />
            <div className="text-3xl font-bold">{formatNumber(globalStats.totalCreditsPurchased)}</div>
            <div className="text-sm text-muted-foreground mt-1">Total Credits Sold</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex flex-col items-center text-center">
            <Activity className="h-8 w-8 text-emerald-500 mb-3" />
            <div className="text-3xl font-bold">₹{formatNumber(globalStats.totalTopUpRevenueINR)}</div>
            <div className="text-sm text-muted-foreground mt-1">Total Top-Up Revenue</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex flex-col items-center text-center">
            <HardDrive className="h-8 w-8 text-amber-500 mb-3" />
            <div className="text-3xl font-bold">{formatNumber(globalStats.totalOrgPoolsLimit)}</div>
            <div className="text-sm text-muted-foreground mt-1">Total Assigned Org Limits</div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderLevel0Orgs = () => {
    if (orgsLoading) return <Skeleton className="h-64 w-full" />;
    if (!orgs || orgs.length === 0) return <div className="text-center py-12 text-muted-foreground">No organizations found.</div>;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Organizations ({orgs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {orgs.map((org: any) => (
              <FolderIcon
                key={org._id}
                label={org.displayName}
                subtitle={`${formatNumber(org.ai_tokens_consumed || 0)} tokens`}
                badge={0} // Maybe show blocked users count?
                icon={Building}
                onClick={() => setPath({ orgId: org._id, orgName: org.displayName })}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderLevel1Roles = () => {
    if (orgDetailLoading || orgUsersLoading) return <Skeleton className="h-64 w-full" />;
    
    // Group users by role to create role folders
    const rolesMap: Record<string, { count: number, tokens: number }> = {};
    if (orgUsers) {
      orgUsers.forEach((user: any) => {
        const role = user.role || "unknown";
        if (!rolesMap[role]) rolesMap[role] = { count: 0, tokens: 0 };
        rolesMap[role].count++;
        rolesMap[role].tokens += user.ai_tokens?.ai_tokens_consumed || 0;
      });
    }

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{path.orgName} — Usage Roles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {Object.entries(rolesMap).map(([role, stats]) => (
                <FolderIcon
                  key={role}
                  label={role.toUpperCase()}
                  subtitle={`${stats.count} users • ${formatNumber(stats.tokens)} tokens`}
                  badge={stats.count}
                  icon={Shield}
                  onClick={() => setPath({ ...path, role })}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderLevel2Users = () => {
    if (orgUsersLoading) return <Skeleton className="h-64 w-full" />;
    
    const usersInRole = orgUsers?.filter((u: any) => u.role === path.role) || [];

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{path.role?.toUpperCase()} Users ({usersInRole.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {usersInRole.map((user: any) => (
              <FolderIcon
                key={user._id}
                label={user.name || user.email}
                subtitle={`${formatNumber(user.ai_tokens?.ai_tokens_consumed || 0)} tokens`}
                badge={user.ai_tokens?.ai_access_blocked ? "BLOCKED" : 0}
                icon={UserIcon}
                onClick={() => setPath({ ...path, userId: user._id, userName: user.name || user.email })}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderLevel3UserDetail = () => {
    if (userDetailLoading) return <Skeleton className="h-96 w-full" />;
    
    return <AiUserDetailPanel userDetail={userDetail} />;
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <PageBreadcrumbs
        items={[
          { label: "Dashboard", href: "/superadmin/dashboard" },
          { label: "AI & Platform Settings", href: "/superadmin/settings" },
          { label: "AI Usage", href: "/superadmin/ai-usage" }
        ]}
      />

      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">AI Usage & Credits</h2>
          <p className="text-muted-foreground mt-2">
            Monitor global token consumption, organization limits, and AI top-up revenue.
          </p>
        </div>
      </div>

      {!path.orgId && renderGlobalStats()}

      {renderBreadcrumbs()}

      {!path.orgId && renderLevel0Orgs()}
      {path.orgId && !path.role && renderLevel1Roles()}
      {path.orgId && path.role && !path.userId && renderLevel2Users()}
      {path.userId && renderLevel3UserDetail()}
    </div>
  );
}
