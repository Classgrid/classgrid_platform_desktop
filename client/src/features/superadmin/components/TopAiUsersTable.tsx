import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/marketing_ui/card";
import { Search } from "lucide-react";
import { DataTable } from "@/components/marketing_ui/data-table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/marketing_ui/select";
import { formatNumber, formatRoleLabel } from "@/lib/utils";
import { useCurrentUser } from "@/features/auth/queries/useCurrentUser";

export interface TopAiUsersTableProps {
  users?: any[];
}

export function TopAiUsersTable({ users = [] }: TopAiUsersTableProps) {
  const { data: currentUser } = useCurrentUser();
  const [search, setSearch] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState("all");
  const [showAll, setShowAll] = React.useState(false);

  // Extract unique roles dynamically from real user data
  const uniqueRoles = useMemo(() => {
    const rolesSet = new Set<string>();
    users.forEach(u => {
      if (u.role || u.roleName) rolesSet.add(u.role || u.roleName);
    });
    return Array.from(rolesSet);
  }, [users]);

  const formattedUsers = useMemo(() => {
    let filtered = [...users];
    
    // Apply role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter(u => (u.role || u.roleName) === roleFilter);
    }

    // Apply search filter
    if (search) {
      const lowerSearch = search.toLowerCase();
      filtered = filtered.filter(u => 
        (u.name && u.name.toLowerCase().includes(lowerSearch)) || 
        (u.email && u.email.toLowerCase().includes(lowerSearch))
      );
    }

    // Sort by total usage descending
    filtered.sort((a, b) => (b.totalUsage || 0) - (a.totalUsage || 0));

    const limit = showAll ? filtered.length : 10;

    return filtered.slice(0, limit).map((u, index) => ({
      id: u.id || u._id || index,
      name: u.name || u.email || "Unknown User",
      email: u.email || "",
      profilePicture: u.profilePicture || null,
      initials: (u.name || u.email || "??").substring(0, 2).toUpperCase(),
      role: u.role ? formatRoleLabel(u.role) : "Unknown Role",
      tokensUsed: formatNumber(u.totalUsage || 0),
      recentTopUp: u.recentTopUp ? formatNumber(u.recentTopUp) : "-"
    }));
  }, [users, search, roleFilter, showAll]);

  const totalFiltered = useMemo(() => {
    let filtered = [...users];
    if (roleFilter !== "all") {
      filtered = filtered.filter(u => (u.role || u.roleName) === roleFilter);
    }
    if (search) {
      const lowerSearch = search.toLowerCase();
      filtered = filtered.filter(u => 
        (u.name && u.name.toLowerCase().includes(lowerSearch)) || 
        (u.email && u.email.toLowerCase().includes(lowerSearch))
      );
    }
    return filtered.length;
  }, [users, search, roleFilter]);

  const columns = [
    {
      key: "user",
      header: "USER",
      width: "w-[45%]",
      render: (_: any, row: any) => (
        <div className="flex items-center gap-3 py-1">
          {row.profilePicture ? (
            <img src={row.profilePicture} alt={row.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
          ) : (currentUser?.profilePicture || currentUser?.platformLogo) && (row.id === currentUser?._id || row.name === currentUser?.name) ? (
            <img src={currentUser.profilePicture || currentUser.platformLogo} alt={row.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
              {row.initials}
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium text-white">{row.name}</span>
            <span className="text-xs text-gray-500 break-all">{row.email}</span>
          </div>
        </div>
      )
    },
    {
      key: "role",
      header: "ROLE",
      width: "w-[15%]",
      render: (value: string) => <span className="text-gray-300">{value}</span>
    },
    {
      key: "tokensUsed",
      header: "TOKENS USED",
      width: "w-[20%]",
      render: (value: string) => <span className="text-gray-300 font-medium">{value}</span>
    },
    {
      key: "recentTopUp",
      header: "RECENT TOP-UP",
      width: "w-[20%]",
      render: (value: string) => <span className="text-gray-400">{value}</span>
    }
  ];

  return (
    <Card className="border border-[#222222] shadow-sm overflow-hidden bg-[#0a0a0a] dark:bg-[#0a0a0a]">
      <CardHeader className="border-b border-[#222222] pb-4 bg-[#0a0a0a] flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold flex items-center gap-2 text-white">
          TOP AI USERS
        </CardTitle>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search Filter..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-[180px] h-[34px] pl-9 pr-3 bg-black border border-[#222222] rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#444444]"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[140px] h-[34px] bg-[#1a1a1a] border-[#222222] text-white hover:bg-[#222222]">
              <SelectValue placeholder="Role Filter" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a1a] border-[#222222] text-white">
              <SelectItem value="all">All Roles</SelectItem>
              {uniqueRoles.map(role => (
                <SelectItem key={role} value={role}>{formatRoleLabel(role)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="p-0 bg-[#0a0a0a] dark:bg-[#0a0a0a] flex flex-col">
        <DataTable 
          columns={columns} 
          rows={formattedUsers} 
          className="border-0 rounded-none bg-transparent"
        />
        {!showAll && totalFiltered > 10 && (
          <div className="p-4 border-t border-[#222222] flex justify-center">
            <button 
              className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
              onClick={() => setShowAll(true)}
            >
              View All Users ({totalFiltered})
            </button>
          </div>
        )}
        {showAll && totalFiltered > 10 && (
          <div className="p-4 border-t border-[#222222] flex justify-center">
            <button 
              className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
              onClick={() => setShowAll(false)}
            >
              Show Less
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

