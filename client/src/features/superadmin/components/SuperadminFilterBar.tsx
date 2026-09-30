import React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/marketing_ui/input";
import { NikhilTimeCalendar } from "@/components/marketing_ui/nikhil_time_calendar";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/marketing_ui/select";

interface SuperadminFilterBarProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  orgTypeFilter: string;
  setOrgTypeFilter: (val: string) => void;
  selectedGlobalOrgId: string;
  setSelectedGlobalOrgId: (val: string) => void;
  dateFilter: Date | undefined;
  setDateFilter: (val: Date | undefined) => void;
  orgs: any[];
}

export function SuperadminFilterBar({
  searchQuery,
  setSearchQuery,
  orgTypeFilter,
  setOrgTypeFilter,
  selectedGlobalOrgId,
  setSelectedGlobalOrgId,
  dateFilter,
  setDateFilter,
  orgs
}: SuperadminFilterBarProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 mb-6 flex flex-col md:flex-row gap-4 items-center animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="relative w-full md:w-64 shrink-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search name, owner, plan..." 
          className="pl-9 bg-background"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      <div className="flex w-full gap-4 overflow-x-auto custom-scrollbar pb-1 md:pb-0 items-center">
        <Select value={orgTypeFilter} onValueChange={setOrgTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Org Type: All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Org Type: All</SelectItem>
            <SelectItem value="school">School</SelectItem>
            <SelectItem value="college">College</SelectItem>
            <SelectItem value="university">University</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={selectedGlobalOrgId} onValueChange={setSelectedGlobalOrgId}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Org Name: All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Org Name: All</SelectItem>
            {orgs?.map((o: any) => (
              <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

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
}
