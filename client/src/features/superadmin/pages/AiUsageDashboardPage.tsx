import React, { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/marketing_ui/button";
import { Input } from "@/components/marketing_ui/input";
import { NikhilTimeCalendar } from "@/components/marketing_ui/nikhil_time_calendar";
import { Search, Filter, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/marketing_ui/card";
import { PageBreadcrumbs } from "@/components/layout/PageBreadcrumbs";
import { 
  Building, 
  ChevronRight,
  Home,
  Shield,
  Activity,
  User as UserIcon,
  Cpu,
  Database,
  HardDrive
} from "lucide-react";
import { 
  useGlobalAiStats, 
  useAiUsageOrgs, 
  useAiOrgDetail, 
  useAiOrgUsers,
  useAiUserDetail,
  useResetOrgUsage,
  useBlockAiOrg
} from "../queries/useAiUsage";
import { DangerConfirmDialog } from "@/components/marketing_ui/danger-confirm-dialog";
import { Skeleton } from "@/components/marketing_ui/skeleton";
import { formatNumber } from "@/lib/utils";
import { AiUserDetailPanel } from "../components/ai-usage/AiUserDetailPanel";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

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
      {badge === "BLOCKED" && (
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
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border rounded-lg shadow-sm p-3 text-sm flex flex-col gap-1 z-50">
        <span className="font-semibold text-foreground flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].payload.fill || payload[0].color }} />
          {payload[0].name}
        </span>
        <span className="text-muted-foreground">{Math.round(payload[0].value)}% Usage</span>
      </div>
    );
  }
  return null;
};

export function AiUsageDashboardPage() {
  const [path, setPath] = useState<PathState>({});
  const [showOrgReset, setShowOrgReset] = useState(false);
  const [showOrgBlock, setShowOrgBlock] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [orgTypeFilter, setOrgTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState<Date | undefined>();
  const resetOrgMutation = useResetOrgUsage();
  const blockOrgMutation = useBlockAiOrg();

  const { data: globalStats, isLoading: globalLoading } = useGlobalAiStats();
  const { data: orgs, isLoading: orgsLoading } = useAiUsageOrgs();

  const { data: orgDetail, isLoading: orgDetailLoading } = useAiOrgDetail(path.orgId || "");
  const { data: orgUsers, isLoading: orgUsersLoading } = useAiOrgUsers(path.orgId || "");
  const { data: userDetail, isLoading: userDetailLoading } = useAiUserDetail(path.userId || "");

  const handleNavigateUp = (level: "root" | "org" | "role") => {
    if (level === "root") setPath({});
    else if (level === "org") setPath({ orgId: path.orgId, orgName: path.orgName });
    else if (level === "role") setPath({ orgId: path.orgId, orgName: path.orgName, role: path.role });
  };

  
  const renderFilterBar = () => {
    return (
      <div className="bg-card border border-border rounded-xl p-4 mb-6 flex flex-col md:flex-row gap-4 items-center animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="relative w-full md:w-64 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search name..." 
            className="pl-9 bg-background"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex w-full gap-4 overflow-x-auto custom-scrollbar pb-1 md:pb-0">
          <div className="min-w-[140px] flex-1">
            <select 
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={orgTypeFilter}
              onChange={(e) => setOrgTypeFilter(e.target.value)}
            >
              <option value="all">Org Type: All</option>
              <option value="school">School</option>
              <option value="college">College</option>
              <option value="university">University</option>
            </select>
          </div>
          
          <div className="min-w-[140px] flex-1">
            <select 
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="all">Org Name: All</option>
              {orgs?.map((o: any) => (
                <option key={o.orgId} value={o.orgId}>{o.orgName}</option>
              ))}
            </select>
          </div>

          <div className="shrink-0">
            <NikhilTimeCalendar 
              date={dateFilter}
              setDate={setDateFilter}
              placeholder="Select Date"
            />
          </div>
        </div>
      </div>
    );
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
      
      {/* Organization Level Action Dialogs */}
      <DangerConfirmDialog
        open={showOrgReset}
        onOpenChange={setShowOrgReset}
        title="Reset Organization Limit?"
        description="This will reset the total usage counter for this organization back to 0."
        onConfirm={() => {
            resetOrgMutation.mutate(path.orgId || "");
            setShowOrgReset(false);
        }}
        confirmText="Reset Limit"
      />
      <DangerConfirmDialog
        open={showOrgBlock}
        onOpenChange={setShowOrgBlock}
        title={orgDetail?.isBlocked ? "Unblock Organization?" : "Block Organization?"}
        description={orgDetail?.isBlocked ? "Unblocking will allow all users in this org to use AI again." : "Blocking will immediately prevent all users in this org from using AI features."}
        onConfirm={() => {
            blockOrgMutation.mutate({ orgId: path.orgId || "", blocked: !orgDetail?.isBlocked });
            setShowOrgBlock(false);
        }}
        confirmText={orgDetail?.isBlocked ? "Unblock" : "Block"}
      />
    </div>
  );
};

  const renderGlobalStats = () => {
    if (globalLoading) return <Skeleton className="h-96 w-full mb-8" />;
    if (!globalStats) return null;

    const { totalCreditsSpent, totalRevenue, creditsPurchasedThisMonth, totalChats, usageTrend, models } = globalStats;
    
    // Convert models to pie chart data
    const pieData = models?.map((m: any, i: number) => ({ 
        name: m.name.split('/').pop(), 
        value: 10 + Math.random() * 90, 
        color: COLORS[i % COLORS.length] 
    })) || [];

    return (
      <div className="space-y-6 mb-8">
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-6 flex flex-col items-center text-center">
              <Cpu className="h-8 w-8 text-blue-500 mb-3" />
              <div className="text-3xl font-bold">{formatNumber(totalCreditsSpent || 0)}</div>
              <div className="text-sm text-muted-foreground mt-1">Total Credits Used</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex flex-col items-center text-center">
              <Database className="h-8 w-8 text-indigo-500 mb-3" />
              <div className="text-3xl font-bold">{formatNumber(creditsPurchasedThisMonth || 0)}</div>
              <div className="text-sm text-muted-foreground mt-1">Credits Sold This Month</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex flex-col items-center text-center">
              <Activity className="h-8 w-8 text-emerald-500 mb-3" />
              <div className="text-3xl font-bold">₹{formatNumber(totalRevenue || 0)}</div>
              <div className="text-sm text-muted-foreground mt-1">Total Top-Up Revenue</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex flex-col items-center text-center">
              <HardDrive className="h-8 w-8 text-amber-500 mb-3" />
              <div className="text-3xl font-bold">{formatNumber(totalChats || 0)}</div>
              <div className="text-sm text-muted-foreground mt-1">Total Chat Sessions</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Daily Usage Trend (Chats)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={usageTrend || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="opacity-10" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(val) => val.split('-').slice(1).join('/')}
                      stroke="currentColor" 
                      className="text-xs opacity-50"
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="currentColor" 
                      className="text-xs opacity-50"
                      tickLine={false}
                      axisLine={false}
                    />
                    <RechartsTooltip 
                      cursor={{ fill: 'currentColor', opacity: 0.05 }}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    />
                    <Bar dataKey="credits" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Model Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full flex flex-col items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  
  const getFilteredOrgs = () => {
    if (!orgs) return [];
    return orgs.filter((org: any) => {
      const matchesSearch = org.orgName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = orgTypeFilter === "all" || org.type === orgTypeFilter;
      return matchesSearch && matchesType;
    });
  };

  const renderLevel0Orgs = () => {
    if (orgsLoading) return <Skeleton className="h-64 w-full" />;
    if (!orgs || orgs.length === 0) return <div className="text-center py-12 text-muted-foreground">No organizations found using AI.</div>;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Organizations ({orgs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {orgs.map((org: any) => (
              <FolderIcon
                key={org.id}
                label={org.name}
                subtitle={`${formatNumber(org.totalUsage || 0)} Credits`}
                badge={org.isBlocked ? "BLOCKED" : 0}
                icon={Building}
                onClick={() => setPath({ orgId: org.id, orgName: org.name })}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

    const renderLevel1Roles = () => {
    if (orgDetailLoading || orgUsersLoading) return <Skeleton className="h-64 w-full" />;

    const isOrgBlocked = orgDetail?.isBlocked;

    return (
      <div className="space-y-6">
        <div className="flex justify-end gap-3 mb-4">
            <Button 
                variant="outline"
                onClick={() => setShowOrgBlock(true)}
                disabled={blockOrgMutation.isPending}
            >
                <Shield className="w-4 h-4 mr-2" />
                {isOrgBlocked ? "Unblock Organization" : "Block Organization"}
            </Button>
            <Button 
                variant="outline"
                onClick={() => setShowOrgReset(true)}
                disabled={resetOrgMutation.isPending}
            >
                <Activity className="w-4 h-4 mr-2" />
                Reset Org Limit
            </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{path.orgName} — Usage Roles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {orgUsers?.map((roleGroup: any) => (
                <FolderIcon
                  key={roleGroup.roleName}
                  label={roleGroup.roleName.toUpperCase()}
                  subtitle={`${roleGroup.userCount} users • ${formatNumber(roleGroup.totalUsage || 0)} Credits`}
                  badge={roleGroup.userCount}
                  icon={Shield}
                  onClick={() => setPath({ ...path, role: roleGroup.roleName })}
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
    
    const roleGroup = orgUsers?.find((r: any) => r.roleName === path.role);
    const usersInRole = roleGroup ? roleGroup.users : [];

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{path.role?.toUpperCase()} Users ({usersInRole.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {usersInRole.map((user: any) => (
              <FolderIcon
                key={user.id}
                label={user.name || user.email}
                subtitle={`${formatNumber(user.totalUsage || 0)} Credits`}
                badge={user.isBlocked ? "BLOCKED" : 0}
                icon={UserIcon}
                onClick={() => setPath({ ...path, userId: user.id, userName: user.name || user.email })}
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
