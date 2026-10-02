import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/marketing_ui/card";
import { Search } from "lucide-react";
import { DataTable } from "@/components/marketing_ui/data-table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/marketing_ui/select";

const DUMMY_USERS = [
  {
    id: 1,
    name: "Priya Sharma",
    email: "priya.sharma@example.com",
    avatar: "https://i.pravatar.cc/150?u=priya",
    role: "Faculty",
    tokensUsed: "45,000",
    recentTopUp: "₹500 (Oct 1)"
  },
  {
    id: 2,
    name: "Rahul Gupta",
    email: "rahul.gupta@example.com",
    avatar: "https://i.pravatar.cc/150?u=rahul",
    role: "Student",
    tokensUsed: "32,000",
    recentTopUp: "-"
  },
  {
    id: 3,
    name: "Anjali Desai",
    email: "anjali.desai@example.com",
    avatar: "https://i.pravatar.cc/150?u=anjali",
    role: "Student",
    tokensUsed: "28,500",
    recentTopUp: "₹200 (Sep 28)"
  }
];

export function TopAiUsersTable() {
  const columns = [
    {
      key: "user",
      header: "USER",
      render: (_: any, row: any) => (
        <div className="flex items-center gap-3 py-1">
          <img src={row.avatar} alt={row.name} className="w-8 h-8 rounded-full object-cover" />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-white">{row.name}</span>
            <span className="text-xs text-gray-500">{row.email}</span>
          </div>
        </div>
      )
    },
    {
      key: "role",
      header: "ROLE",
      render: (value: string) => <span className="text-gray-300">{value}</span>
    },
    {
      key: "tokensUsed",
      header: "TOKENS USED",
      render: (value: string) => <span className="text-gray-300 font-medium">{value}</span>
    },
    {
      key: "recentTopUp",
      header: "RECENT TOP-UP",
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
              className="w-[180px] h-[34px] pl-9 pr-3 bg-black border border-[#222222] rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#444444]"
            />
          </div>
          <Select defaultValue="all">
            <SelectTrigger className="w-[120px] h-[34px] bg-[#1a1a1a] border-[#222222] text-white hover:bg-[#222222]">
              <SelectValue placeholder="Role Filter" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a1a] border-[#222222] text-white">
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="faculty">Faculty</SelectItem>
              <SelectItem value="student">Student</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="p-0 bg-[#0a0a0a] dark:bg-[#0a0a0a] flex flex-col">
        <DataTable 
          columns={columns} 
          rows={DUMMY_USERS} 
          className="border-0 rounded-none bg-transparent"
        />
        <div className="p-4 border-t border-[#222222] flex justify-center">
          <button className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
            View All Users
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
