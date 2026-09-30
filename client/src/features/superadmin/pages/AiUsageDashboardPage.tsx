import React, { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/marketing_ui/button";
import { Input } from "@/components/marketing_ui/input";
import { SuperadminFilterBar } from "@/features/superadmin/components/SuperadminFilterBar";
import { Search, Filter, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/marketing_ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/marketing_ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/marketing_ui/dialog";
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
  useBlockAiOrg,
  useUpdateOrgAiLimits
} from "@/features/superadmin/queries/useAiUsage";
import { DangerConfirmDialog } from "@/components/marketing_ui/danger-confirm-dialog";
import { Skeleton } from "@/components/marketing_ui/skeleton";
import { formatNumber } from "@/lib/utils";
import { AiUserDetailPanel } from "@/features/superadmin/components/ai-usage/AiUserDetailPanel";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Legend, Pie, Cell } from "recharts";

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
        <span className="text-muted-foreground">{new Intl.NumberFormat("en-IN").format(payload[0].value)} Tokens Consumed</span>
      </div>
    );
  }
  return null;
};

export function AiUsageDashboardPage() {
  const [path, setPath] = useState<PathState>({});
  const [showOrgReset, setShowOrgReset] = useState(false);
  const [showOrgBlock, setShowOrgBlock] = useState(false);
  const [showLimitsDialog, setShowLimitsDialog] = useState(false);
  const [tempLimits, setTempLimits] = useState({ poolLimit: 0, userWeeklyLimit: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const [orgTypeFilter, setOrgTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState<Date | undefined>();
  const [selectedGlobalOrgId, setSelectedGlobalOrgId] = useState<string>("all");

  const [chatsTime, setChatsTime] = useState<"daily" | "weekly" | "monthly">("daily");
  const [orgsTime, setOrgsTime] = useState<"daily" | "weekly" | "monthly">("daily");
  const [usersTime, setUsersTime] = useState<"daily" | "weekly" | "monthly">("daily");
  
  const resetOrgMutation = useResetOrgUsage();
  const blockOrgMutation = useBlockAiOrg();
  const updateLimitsMutation = useUpdateOrgAiLimits();

  const { data: globalStats, isLoading: globalLoading } = useGlobalAiStats(selectedGlobalOrgId !== "all" ? selectedGlobalOrgId : undefined);

  const getAggregatedData = (data: any[], type: "daily"| "weekly"| "monthly") => {
    if (!data) return [];
    if (type === "daily") return data;
    const aggregated: any = {};
    data.forEach(d => {
      let key = d.date;
      if (type === "weekly") {
         const date = new Date(d.date);
         const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
         const week = Math.ceil((date.getDate() + firstDay.getDay()) / 7);
         key = `Week ${week} (${date.toLocaleString('default', { month: 'short' })})`;
      } else if (type === "monthly") {
         const date = new Date(d.date);
         key = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      }
      if (!aggregated[key]) {
         aggregated[key] = { date: key, requests: 0, activeUsers: 0, activeOrgs: 0, activeUsersList: [], activeOrgsList: [] };
      }
      aggregated[key].requests += d.requests || 0;
      
      const newUsersList = [...aggregated[key].activeUsersList, ...(d.activeUsersList || [])];
      const newOrgsList = [...aggregated[key].activeOrgsList, ...(d.activeOrgsList || [])];
      
      aggregated[key].activeUsersList = newUsersList;
      aggregated[key].activeOrgsList = newOrgsList;
      
      aggregated[key].activeUsers = new Set(newUsersList).size;
      aggregated[key].activeOrgs = new Set(newOrgsList).size;
    });
    return Object.values(aggregated);
  };
  const { data: orgs, isLoading: orgsLoading } = useAiUsageOrgs();

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
          <Activity className="h-4 w-4 mr-1.5" /> AI Usage & Credits
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

    const { totalCreditsSpent, totalRevenue, creditsPurchasedThisMonth, totalChats, usageTrend, models, orgsBreakdown, usersBreakdown } = globalStats;
    // Prepare pie chart data
    const modelPieData = models?.map((m: any, i: number) => ({ 
        name: m.name.split('/').pop(), 
        value: m.value || m.requests || 0,
        color: COLORS[i % COLORS.length]
    })) || [];

    const UniversalTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
        const date = new Date(label);
        const displayLabel = isNaN(date.getTime()) ? label : date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        return (
          <div className="bg-background border border-border rounded-lg shadow-sm p-3 text-sm flex flex-col gap-2 z-50">
            <span className="font-semibold text-foreground mb-1">{displayLabel || payload[0].payload.name}</span>
            {payload.map((entry: any, index: number) => (
              <span key={index} className="flex items-center gap-2" style={{ color: entry.color }}>
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                {entry.name} : {formatNumber(entry.value)}
              </span>
            ))}
          </div>
        );
      }
      return null;
    };

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
              <Building className="h-8 w-8 text-emerald-500 mb-3" />
              <div className="text-3xl font-bold">{formatNumber(orgs?.length || 0)}</div>
              <div className="text-sm text-muted-foreground mt-1">Active Organizations</div>
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

        <SuperadminFilterBar 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          orgTypeFilter={orgTypeFilter}
          setOrgTypeFilter={setOrgTypeFilter}
          selectedGlobalOrgId={selectedGlobalOrgId}
          setSelectedGlobalOrgId={setSelectedGlobalOrgId}
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          orgs={orgs || []}
        />

        <div className="flex flex-col space-y-6">
          {/* Bar Chart 1: Daily AI Requests */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Daily Usage Trend (Chats)</CardTitle>
              <Select value={chatsTime} onValueChange={setChatsTime as any}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Daily" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getAggregatedData(usageTrend, chatsTime)} barCategoryGap="30%" margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="opacity-10" />
                    <XAxis 
                      dataKey="date" 
                      stroke="currentColor" 
                      className="text-xs opacity-50" 
                      tickLine={false} 
                      axisLine={false}
                      minTickGap={40}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return isNaN(date.getTime()) ? value : date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                      }}
                    />
                    <YAxis stroke="currentColor" className="text-xs opacity-50" tickLine={false} axisLine={false} />
                    <RechartsTooltip 
                        cursor={{ fill: 'currentColor', opacity: 0.05 }}
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const date = new Date(label);
                            const displayLabel = isNaN(date.getTime()) ? label : date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                            return (
                              <div className="bg-background border border-border rounded-lg shadow-sm p-3 text-sm flex flex-col gap-2 z-50">
                                <span className="font-semibold text-foreground mb-1">{displayLabel}</span>
                                {payload.map((entry: any, index: number) => (
                                  <span key={index} className="flex items-center gap-2" style={{ color: entry.color }}>
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                    {entry.name} : {formatNumber(entry.value)}
                                  </span>
                                ))}
                              </div>
                            );
                          }
                          return null;
                        }}
                    />
                    <Bar dataKey="requests" name="AI Requests" fill="#f59e0b" radius={[2, 2, 0, 0]} maxBarSize={12} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Bar Chart 2: Input vs Output Tokens */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Tokens Consumed (Input vs Output)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={usageTrend || []} barCategoryGap="30%" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="opacity-10" />
                    <XAxis 
                      dataKey="date" 
                      stroke="currentColor" 
                      className="text-xs opacity-50" 
                      tickLine={false} 
                      axisLine={false}
                      minTickGap={40}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return isNaN(date.getTime()) ? value : date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                      }}
                    />
                    <YAxis stroke="currentColor" className="text-xs opacity-50" tickLine={false} axisLine={false} />
                    <RechartsTooltip cursor={{ fill: 'currentColor', opacity: 0.05 }} content={<UniversalTooltip />} />
                    <Bar dataKey="promptTokens" name="Input Tokens" stackId="a" fill="#f97316" radius={[0, 0, 0, 0]} maxBarSize={12} />
                    <Bar dataKey="completionTokens" name="Output Tokens" stackId="a" fill="#3b82f6" radius={[2, 2, 0, 0]} maxBarSize={12} />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Bar Chart 3: Cost Spend Trend */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Cost Spend Trend (INR Revenue)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={usageTrend || []} barCategoryGap="30%" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="opacity-10" />
                    <XAxis 
                      dataKey="date" 
                      stroke="currentColor" 
                      className="text-xs opacity-50" 
                      tickLine={false} 
                      axisLine={false}
                      minTickGap={40}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return isNaN(date.getTime()) ? value : date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                      }}
                    />
                    <YAxis stroke="currentColor" className="text-xs opacity-50" tickLine={false} axisLine={false} />
                    <RechartsTooltip cursor={{ fill: 'currentColor', opacity: 0.05 }} content={<UniversalTooltip />} />
                    <Bar dataKey="revenue" name="Cost (INR)" fill="#10b981" radius={[2, 2, 0, 0]} maxBarSize={12} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Bar Chart 4: Active Organizations */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Active Organizations</CardTitle>
              <Select value={orgsTime} onValueChange={setOrgsTime as any}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Daily" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getAggregatedData(usageTrend, orgsTime)} barCategoryGap="30%" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="opacity-10" />
                    <XAxis 
                      dataKey="date" 
                      stroke="currentColor" 
                      className="text-xs opacity-50" 
                      tickLine={false} 
                      axisLine={false}
                      minTickGap={40}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return isNaN(date.getTime()) ? value : date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                      }}
                    />
                    <YAxis stroke="currentColor" className="text-xs opacity-50" tickLine={false} axisLine={false} />
                    <RechartsTooltip cursor={{ fill: 'currentColor', opacity: 0.05 }} content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            const ids = [...new Set(data.activeOrgsList || [])];
                            
                            return (
                              <div className="bg-background border border-border rounded-lg shadow-sm p-3 text-sm flex flex-col gap-2 z-50 min-w-[220px]">
                                <span className="font-medium text-foreground">{label}</span>
                                <div className="text-xs text-muted-foreground mb-1">Active Organizations: {data.activeOrgs}</div>
                                {ids.length === 0 ? <div className="text-xs text-muted-foreground italic">No organizations active</div> : null}
                                <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2">
                                    {ids.slice(0, 10).map((id: any) => {
                                       const org = orgsBreakdown?.find((o: any) => o.orgId === id);
                                       if (!org) return null;
                                       return (
                                         <div key={id} className="flex flex-col space-y-1 mb-2 border-b border-border/50 pb-2 last:border-0 last:pb-0">
                                            <div className="flex items-center space-x-2">
                                                {org.logo ? (
                                                    <img src={org.logo} alt={org.name} className="h-5 w-5 rounded object-cover" />
                                                ) : (
                                                    <div className="h-5 w-5 rounded bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold">
                                                        {org.name?.substring(0, 2).toUpperCase()}
                                                    </div>
                                                )}
                                                <span className="truncate font-medium text-xs text-foreground">Org: {org.name}</span>
                                            </div>
                                            <span className="text-[10px] text-muted-foreground font-mono">Org ID: {org.orgId}</span>
                                         </div>
                                       );
                                    })}
                                    {ids.length > 10 && <div className="text-xs text-muted-foreground italic">+{ids.length - 10} more...</div>}
                                </div>
                              </div>
                            );
                        }
                        return null;
                    }} />
                    <Bar dataKey="activeOrgs" name="Active Organizations" fill="#2563eb" radius={[2, 2, 0, 0]} maxBarSize={12} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Bar Chart 5: Active Users */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Active Users</CardTitle>
              <Select value={usersTime} onValueChange={setUsersTime as any}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Daily" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getAggregatedData(usageTrend, usersTime)} barCategoryGap="30%" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="opacity-10" />
                    <XAxis 
                      dataKey="date" 
                      stroke="currentColor" 
                      className="text-xs opacity-50" 
                      tickLine={false} 
                      axisLine={false}
                      minTickGap={40}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return isNaN(date.getTime()) ? value : date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                      }}
                    />
                    <YAxis stroke="currentColor" className="text-xs opacity-50" tickLine={false} axisLine={false} />
                    <RechartsTooltip cursor={{ fill: 'currentColor', opacity: 0.05 }} content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            const ids = [...new Set(data.activeUsersList || [])];
                            
                            return (
                              <div className="bg-background border border-border rounded-lg shadow-sm p-3 text-sm flex flex-col gap-2 z-50 min-w-[220px]">
                                <span className="font-medium text-foreground">{label}</span>
                                <div className="text-xs text-muted-foreground mb-1">Active Users: {data.activeUsers}</div>
                                {ids.length === 0 ? <div className="text-xs text-muted-foreground italic">No users active</div> : null}
                                <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2">
                                    {ids
                                        .map((id: any) => ({
                                            id,
                                            uData: usersBreakdown?.find((u: any) => u.userId === id || u._id === id || u.name === id) || { name: 'Unknown User', value: 0 }
                                        }))
                                        .sort((a: any, b: any) => (b.uData.value || 0) - (a.uData.value || 0))
                                        .slice(0, 3)
                                        .map(({ id, uData }: any) => (
                                         <div key={id} className="flex flex-col space-y-1 mb-2 border-b border-border/50 pb-2 last:border-0 last:pb-0">
                                            <div className="flex items-center space-x-2">
                                                {uData.profilePicture ? (
                                                    <img src={uData.profilePicture} alt={uData.name} className="h-5 w-5 rounded-full object-cover" />
                                                ) : (
                                                    <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold">
                                                        {uData.name?.substring(0, 2).toUpperCase()}
                                                    </div>
                                                )}
                                                <div className="flex flex-col">
                                                    <span className="truncate font-medium text-xs text-foreground">{uData.name}</span>
                                                    {uData.email && <span className="truncate text-[10px] text-muted-foreground">{uData.email}</span>}
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-0.5 mt-1">
                                                {uData.orgName && <span className="text-[10px] text-muted-foreground">Org: {uData.orgName}</span>}
                                                <span className="text-[10px] text-muted-foreground font-mono">User ID: {id}</span>
                                            </div>
                                         </div>
                                    ))}
                                    {ids.length > 3 && <div className="text-xs text-muted-foreground italic">+{ids.length - 3} more...</div>}
                                </div>
                              </div>
                            );
                        }
                        return null;
                    }} />
                    <Bar dataKey="activeUsers" name="Active Users" fill="#8b5cf6" radius={[2, 2, 0, 0]} maxBarSize={12} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Breakdowns Row */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="col-span-1 lg:col-span-1">
              <CardHeader><CardTitle>Top Organizations by Requests</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-4">
                  {orgsBreakdown?.sort((a: any, b: any) => b.requests - a.requests).slice(0, 10).map((org: any, i: number) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {org.logo ? (
                           <img src={org.logo} alt={org.name} className="h-8 w-8 rounded object-cover" />
                        ) : (
                           <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-primary font-semibold">
                             {org.name.substring(0, 2).toUpperCase()}
                           </div>
                        )}
                        <div>
                          <p className="text-sm font-medium leading-none max-w-[120px] truncate" title={org.name}>{org.name}</p>
                          <p className="text-xs text-muted-foreground mt-1 truncate max-w-[120px]" title={org.orgId}>ID: {org.orgId}</p>
                        </div>
                      </div>
                      <div className="font-medium text-sm">
                        {formatNumber(org.requests)}
                      </div>
                    </div>
                  ))}
                  {(!orgsBreakdown || orgsBreakdown.length === 0) && (
                    <div className="text-center text-muted-foreground py-8">No organization data</div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-1 lg:col-span-1">
              <CardHeader><CardTitle>Top Users by Requests</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-4">
                  {usersBreakdown?.sort((a: any, b: any) => b.requests - a.requests).slice(0, 10).map((user: any, i: number) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-primary font-semibold">
                          {user.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium leading-none max-w-[120px] truncate" title={user.name}>{user.name}</p>
                          <p className="text-xs text-muted-foreground mt-1 truncate max-w-[120px]" title={user.orgName}>{user.orgName}</p>
                        </div>
                      </div>
                      <div className="font-medium text-sm">
                        {formatNumber(user.requests)}
                      </div>
                    </div>
                  ))}
                  {(!usersBreakdown || usersBreakdown.length === 0) && (
                    <div className="text-center text-muted-foreground py-8">No user data</div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-1 lg:col-span-1">
              <CardHeader><CardTitle>Requests by Model</CardTitle></CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={modelPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                        {modelPieData.map((e: any, i: number) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <RechartsTooltip content={<UniversalTooltip />} />
                      <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>


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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-emerald-500/10 border-emerald-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-emerald-700 dark:text-emerald-400 text-sm font-medium flex items-center">
                <Activity className="w-4 h-4 mr-2" />
                Monthly Org AI Pool
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                {formatNumber(orgDetail?.poolLimit || 500000)}
              </div>
              <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-1">Tokens shared across all users</p>
              <Button 
                variant="outline"
                className="w-full mt-4 bg-white/50 hover:bg-white/80 dark:bg-black/50 dark:hover:bg-black/80 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                onClick={() => setShowOrgReset(true)}
                disabled={resetOrgMutation.isPending}
              >
                Reset Organization Usage
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-blue-500/10 border-blue-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-blue-700 dark:text-blue-400 text-sm font-medium flex items-center">
                <UserIcon className="w-4 h-4 mr-2" />
                7-Day Free User Limit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                {formatNumber(orgDetail?.userWeeklyLimit || 100000)}
              </div>
              <p className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-1">Free tokens per individual user</p>
              <Dialog open={showLimitsDialog} onOpenChange={setShowLimitsDialog}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline"
                    className="w-full mt-4 bg-white/50 hover:bg-white/80 dark:bg-black/50 dark:hover:bg-black/80 text-blue-700 dark:text-blue-400 border-blue-500/30"
                    onClick={() => setTempLimits({ poolLimit: orgDetail?.poolLimit || 0, userWeeklyLimit: orgDetail?.userWeeklyLimit || 0 })}
                  >
                    Manage Organization Limits
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Manage AI Pool Limits</DialogTitle>
                    <DialogDescription>
                      Update the token allocations for the entire organization and the individual weekly user limit.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label className="text-right text-sm font-medium">Org (Monthly)</label>
                      <Input
                        type="number"
                        value={tempLimits.poolLimit}
                        onChange={(e) => setTempLimits(prev => ({ ...prev, poolLimit: Number(e.target.value) }))}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label className="text-right text-sm font-medium">User (Weekly)</label>
                      <Input
                        type="number"
                        value={tempLimits.userWeeklyLimit}
                        onChange={(e) => setTempLimits(prev => ({ ...prev, userWeeklyLimit: Number(e.target.value) }))}
                        className="col-span-3"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowLimitsDialog(false)}>Cancel</Button>
                    <Button 
                      onClick={() => {
                        updateLimitsMutation.mutate({ 
                          orgId: path.orgId || "", 
                          data: { pro_pool_limit: tempLimits.poolLimit, free_weekly_limit_per_user: tempLimits.userWeeklyLimit } 
                        });
                        setShowLimitsDialog(false);
                      }}
                      disabled={updateLimitsMutation.isPending}
                    >
                      Save Changes
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          <Card className={isOrgBlocked ? "bg-rose-500/10 border-rose-500/20" : "bg-slate-500/10 border-slate-500/20"}>
            <CardHeader className="pb-2">
              <CardTitle className={isOrgBlocked ? "text-rose-700 dark:text-rose-400 text-sm font-medium flex items-center" : "text-slate-700 dark:text-slate-400 text-sm font-medium flex items-center"}>
                <Shield className="w-4 h-4 mr-2" />
                Security & Access
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={isOrgBlocked ? "text-xl font-bold text-rose-700 dark:text-rose-400" : "text-xl font-bold text-slate-700 dark:text-slate-400"}>
                {isOrgBlocked ? "BLOCKED" : "ACTIVE"}
              </div>
              <p className={isOrgBlocked ? "text-xs text-rose-600/80 dark:text-rose-400/80 mt-1" : "text-xs text-slate-600/80 dark:text-slate-400/80 mt-1"}>
                {isOrgBlocked ? "All AI usage is suspended" : "Users can access AI features"}
              </p>
              <Button 
                variant="outline"
                className={isOrgBlocked ? "w-full mt-4 bg-white/50 hover:bg-white/80 dark:bg-black/50 dark:hover:bg-black/80 text-rose-700 dark:text-rose-400 border-rose-500/30" : "w-full mt-4 bg-white/50 hover:bg-white/80 dark:bg-black/50 dark:hover:bg-black/80 text-slate-700 dark:text-slate-400 border-slate-500/30"}
                onClick={() => setShowOrgBlock(true)}
                disabled={blockOrgMutation.isPending}
              >
                {isOrgBlocked ? "Unblock Organization" : "Block Organization"}
              </Button>
            </CardContent>
          </Card>
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
      {renderBreadcrumbs()}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">AI Usage & Credits</h2>
          <p className="text-muted-foreground mt-2">
            Monitor global token consumption, organization limits, and AI top-up revenue.
          </p>
        </div>
      </div>

      {!path.orgId && renderGlobalStats()}

      {!path.orgId && renderLevel0Orgs()}
      {path.orgId && !path.role && renderLevel1Roles()}
      {path.orgId && path.role && !path.userId && renderLevel2Users()}
      {path.userId && renderLevel3UserDetail()}
    </div>
  );
}
