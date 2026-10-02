import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/marketing_ui/card";
import { TrendingUp, TrendingDown, Calendar, ChevronDown } from "lucide-react";
import { NikhilTimeCalendar } from "@/components/marketing_ui/nikhil_time_calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/marketing_ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const DUMMY_CHATS_DATA = [
  { date: "Oct 1", chats: 120 },
  { date: "Oct 2", chats: 150 },
  { date: "Oct 3", chats: 80 },
  { date: "Oct 4", chats: 200 },
  { date: "Oct 5", chats: 90 },
  { date: "Oct 6", chats: 310 }, // Most Active
  { date: "Oct 7", chats: 40 },  // Least Used
];

const DUMMY_CREDITS_DATA = [
  { date: "Oct 1", input: 8000, output: 2000 },
  { date: "Oct 2", input: 9200, output: 1500 },
  { date: "Oct 3", input: 6000, output: 1000 },
  { date: "Oct 4", input: 11000, output: 3000 },
  { date: "Oct 5", input: 6000, output: 2000 },
  { date: "Oct 6", input: 14000, output: 4000 },
  { date: "Oct 7", input: 200, output: 50 },
];

export function AiUsageTrendsChart() {
  const [chatDate, setChatDate] = React.useState<Date | undefined>(new Date());
  const [creditsDate, setCreditsDate] = React.useState<Date | undefined>(new Date());

  return (
    <div className="flex flex-col gap-4">
      {/* 1. Daily Chat Trend */}
      <Card className="border border-[#222222] shadow-sm overflow-hidden bg-[#0a0a0a] dark:bg-[#0a0a0a]">
        <CardHeader className="border-b border-[#222222] pb-4 bg-[#0a0a0a] flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2 text-white">
            Daily Chat Trend
          </CardTitle>
          <div className="flex items-center gap-3">
            <NikhilTimeCalendar 
              value={chatDate} 
              onChange={setChatDate as any} 
              showTime={false} 
              placeholder="Select Date" 
              className="w-[140px] h-9 border border-[#222222] bg-black text-white hover:bg-[#111111]" 
            />
            <Select defaultValue="USD">
              <SelectTrigger className="w-[80px] h-9 border border-[#222222] bg-[#1a1a1a] text-white hover:bg-[#222222]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-[#222222] text-white">
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-6 bg-[#0a0a0a] dark:bg-[#0a0a0a]">
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={DUMMY_CHATS_DATA}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#222222" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#888888" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#888888" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => `${value}`} 
                />
                <Tooltip 
                  cursor={{fill: '#1a1a1a'}}
                  contentStyle={{ backgroundColor: '#000000', border: '1px solid #333333', borderRadius: '8px' }}
                  labelStyle={{ color: '#ffffff', fontWeight: 'bold', marginBottom: '8px' }}
                  itemStyle={{ fontSize: '14px', padding: '2px 0' }}
                />
                <Legend 
                  iconType="square" 
                  wrapperStyle={{ paddingTop: '20px', fontSize: '14px', color: '#888888' }}
                />
                <Bar dataKey="chats" name="Total Chats" fill="#ea580c" barSize={12} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 2. Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Most Active */}
        <div className="bg-[#0a0a0a] dark:bg-[#0a0a0a] border border-[#222222] p-4 rounded-xl shadow-sm flex items-start gap-4">
          <div className="p-2.5 rounded-full bg-emerald-500/10 text-emerald-500">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-white">Most Active Day</span>
            <span className="text-xs text-[#888888] mt-0.5">Oct 6, 2026</span>
            <span className="text-lg font-bold text-emerald-500 mt-1">
              310 <span className="text-xs font-normal">chats</span>
            </span>
          </div>
        </div>

        {/* Least Used */}
        <div className="bg-[#0a0a0a] dark:bg-[#0a0a0a] border border-[#222222] p-4 rounded-xl shadow-sm flex items-start gap-4">
          <div className="p-2.5 rounded-full bg-rose-500/10 text-rose-500">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-white">Least Used Day</span>
            <span className="text-xs text-[#888888] mt-0.5">Oct 7, 2026</span>
            <span className="text-lg font-bold text-rose-500 mt-1">
              40 <span className="text-xs font-normal">chats</span>
            </span>
          </div>
        </div>
      </div>

      {/* 3. Daily Credits Used Trend */}
      <Card className="border border-[#222222] shadow-sm overflow-hidden bg-[#0a0a0a] dark:bg-[#0a0a0a]">
        <CardHeader className="border-b border-[#222222] pb-4 bg-[#0a0a0a] flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2 text-white">
            Daily Credits Used Trend
          </CardTitle>
          <div className="flex items-center gap-3">
            <NikhilTimeCalendar 
              value={creditsDate} 
              onChange={setCreditsDate as any} 
              showTime={false} 
              placeholder="Select Date" 
              className="w-[140px] h-9 border border-[#222222] bg-black text-white hover:bg-[#111111]" 
            />
            <Select defaultValue="USD">
              <SelectTrigger className="w-[80px] h-9 border border-[#222222] bg-[#1a1a1a] text-white hover:bg-[#222222]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-[#222222] text-white">
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-6 bg-[#0a0a0a] dark:bg-[#0a0a0a]">
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={DUMMY_CREDITS_DATA}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#222222" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#888888" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#888888" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => `${value}`} 
                />
                <Tooltip 
                  cursor={{fill: '#1a1a1a'}}
                  contentStyle={{ backgroundColor: '#000000', border: '1px solid #333333', borderRadius: '8px' }}
                  labelStyle={{ color: '#ffffff', fontWeight: 'bold', marginBottom: '8px' }}
                  itemStyle={{ fontSize: '14px', padding: '2px 0' }}
                />
                <Legend 
                  iconType="square" 
                  wrapperStyle={{ paddingTop: '20px', fontSize: '14px', color: '#888888' }}
                />
                <Bar dataKey="input" name="Input Credits" stackId="a" fill="#ea580c" barSize={12} />
                <Bar dataKey="output" name="Output Credits" stackId="a" fill="#3b82f6" barSize={12} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
