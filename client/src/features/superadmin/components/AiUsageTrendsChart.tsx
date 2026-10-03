import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/marketing_ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
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

export interface AiUsageTrendsChartProps {
  data?: any[];
}

export function AiUsageTrendsChart({ data = [] }: AiUsageTrendsChartProps) {
  const [chatDate, setChatDate] = React.useState<Date | undefined>();
  const [creditsDate, setCreditsDate] = React.useState<Date | undefined>();
  const [chatTimePeriod, setChatTimePeriod] = React.useState<"daily" | "weekly" | "monthly">("daily");
  const [creditsTimePeriod, setCreditsTimePeriod] = React.useState<"daily" | "weekly" | "monthly">("daily");

  const { mostActive, leastUsed, chartData } = useMemo(() => {
    if (!data || data.length === 0) {
      return { mostActive: null, leastUsed: null, chartData: [] };
    }

    const validData = data.filter(d => d.requests !== undefined);
    if (validData.length === 0) {
      return { mostActive: null, leastUsed: null, chartData: data };
    }

    let max = validData[0];
    let min = validData[0];

    validData.forEach(d => {
      if ((d.requests || 0) > (max.requests || 0)) max = d;
      if ((d.requests || 0) < (min.requests || 0)) min = d;
    });

    return { mostActive: max, leastUsed: min, chartData: data };
  }, [data]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatShortDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Aggregate data by time period
  const getAggregatedData = (rawData: any[], period: "daily" | "weekly" | "monthly") => {
    if (!rawData || rawData.length === 0) return [];
    
    const formatted = rawData.map(d => ({
      ...d,
      shortDate: formatShortDate(d.date)
    }));

    if (period === "daily") return formatted;

    const aggregated: Record<string, any> = {};
    
    rawData.forEach(d => {
      let key = d.date;
      if (period === "weekly") {
        const date = new Date(d.date);
        if (isNaN(date.getTime())) return;
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        const week = Math.ceil((date.getDate() + firstDay.getDay()) / 7);
        key = `Week ${week} (${date.toLocaleString('default', { month: 'short' })})`;
      } else if (period === "monthly") {
        const date = new Date(d.date);
        if (isNaN(date.getTime())) return;
        key = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      }

      if (!aggregated[key]) {
        aggregated[key] = { shortDate: key, requests: 0, promptTokens: 0, completionTokens: 0 };
      }
      aggregated[key].requests += d.requests || 0;
      aggregated[key].promptTokens += d.promptTokens || 0;
      aggregated[key].completionTokens += d.completionTokens || 0;
    });

    return Object.values(aggregated);
  };

  const chatChartData = useMemo(() => getAggregatedData(chartData, chatTimePeriod), [chartData, chatTimePeriod]);
  const creditsChartData = useMemo(() => getAggregatedData(chartData, creditsTimePeriod), [chartData, creditsTimePeriod]);

  return (
    <div className="flex flex-col gap-4">
      {/* 1. Daily Chat Trend */}
      <Card className="border border-[#222222] shadow-sm overflow-hidden bg-[#0a0a0a] dark:bg-[#0a0a0a]">
        <CardHeader className="border-b border-[#222222] pb-4 bg-[#0a0a0a] flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2 text-white">
            {chatTimePeriod === "daily" ? "Daily" : chatTimePeriod === "weekly" ? "Weekly" : "Monthly"} Chat Trend
          </CardTitle>
          <div className="flex items-center gap-3">
            <NikhilTimeCalendar 
              value={chatDate} 
              onChange={setChatDate as any} 
              showTime={true} 
              placeholder="Select Date" 
              className="w-[180px] h-9 border border-[#222222] bg-black text-white hover:bg-[#111111]" 
            />
            <Select value={chatTimePeriod} onValueChange={setChatTimePeriod as any}>
              <SelectTrigger className="w-[100px] h-9 border border-[#222222] bg-[#1a1a1a] text-white hover:bg-[#222222]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-[#222222] text-white">
                <SelectItem value="daily">Day</SelectItem>
                <SelectItem value="weekly">Week</SelectItem>
                <SelectItem value="monthly">Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-6 bg-[#0a0a0a] dark:bg-[#0a0a0a]">
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chatChartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#222222" vertical={false} />
                <XAxis 
                  dataKey="shortDate" 
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
                <Bar dataKey="requests" name="Total Chats" fill="#ea580c" barSize={12} radius={[2, 2, 0, 0]} />
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
            <span className="text-xs text-[#888888] mt-0.5">{mostActive ? formatDate(mostActive.date) : 'N/A'}</span>
            <span className="text-lg font-bold text-emerald-500 mt-1">
              {mostActive?.requests || 0} <span className="text-xs font-normal">chats</span>
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
            <span className="text-xs text-[#888888] mt-0.5">{leastUsed ? formatDate(leastUsed.date) : 'N/A'}</span>
            <span className="text-lg font-bold text-rose-500 mt-1">
              {leastUsed?.requests || 0} <span className="text-xs font-normal">chats</span>
            </span>
          </div>
        </div>
      </div>

      {/* 3. Daily Credits Used Trend */}
      <Card className="border border-[#222222] shadow-sm overflow-hidden bg-[#0a0a0a] dark:bg-[#0a0a0a]">
        <CardHeader className="border-b border-[#222222] pb-4 bg-[#0a0a0a] flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2 text-white">
            {creditsTimePeriod === "daily" ? "Daily" : creditsTimePeriod === "weekly" ? "Weekly" : "Monthly"} Credits Used Trend
          </CardTitle>
          <div className="flex items-center gap-3">
            <NikhilTimeCalendar 
              value={creditsDate} 
              onChange={setCreditsDate as any} 
              showTime={true} 
              placeholder="Select Date" 
              className="w-[180px] h-9 border border-[#222222] bg-black text-white hover:bg-[#111111]" 
            />
            <Select value={creditsTimePeriod} onValueChange={setCreditsTimePeriod as any}>
              <SelectTrigger className="w-[100px] h-9 border border-[#222222] bg-[#1a1a1a] text-white hover:bg-[#222222]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-[#222222] text-white">
                <SelectItem value="daily">Day</SelectItem>
                <SelectItem value="weekly">Week</SelectItem>
                <SelectItem value="monthly">Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-6 bg-[#0a0a0a] dark:bg-[#0a0a0a]">
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={creditsChartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#222222" vertical={false} />
                <XAxis 
                  dataKey="shortDate" 
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
                <Bar dataKey="promptTokens" name="Input Tokens" stackId="a" fill="#ea580c" barSize={12} />
                <Bar dataKey="completionTokens" name="Output Tokens" stackId="a" fill="#3b82f6" barSize={12} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

