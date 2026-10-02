import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/marketing_ui/card";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";
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

const DUMMY_CHART_DATA = [
  { date: "Oct 1", input: 1200000, output: 20000 },
  { date: "Oct 4", input: 0, output: 0 },
  { date: "Oct 7", input: 0, output: 0 },
  { date: "Oct 10", input: 0, output: 0 },
  { date: "Oct 13", input: 0, output: 0 },
  { date: "Oct 16", input: 0, output: 0 },
  { date: "Oct 19", input: 0, output: 0 },
  { date: "Oct 22", input: 0, output: 0 },
  { date: "Oct 25", input: 0, output: 0 },
  { date: "Oct 28", input: 0, output: 0 },
  { date: "Oct 31", input: 0, output: 0 },
];

export function AiUsageTrendsChart() {
  return (
    <div className="flex flex-col gap-4">
      {/* Chart Card */}
      <Card className="border border-border shadow-sm overflow-hidden bg-card">
        <CardHeader className="bg-muted/10 border-b border-border pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-500" />
            7-Day Platform Usage Trends
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 bg-[#0a0a0a] dark:bg-[#0a0a0a]">
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={DUMMY_CHART_DATA}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#333333" vertical={false} />
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
                  cursor={{fill: '#222222'}}
                  contentStyle={{ backgroundColor: '#000000', border: '1px solid #333333', borderRadius: '8px' }}
                  labelStyle={{ color: '#ffffff', fontWeight: 'bold', marginBottom: '8px' }}
                  itemStyle={{ fontSize: '14px', padding: '2px 0' }}
                />
                <Legend 
                  iconType="square" 
                  wrapperStyle={{ paddingTop: '20px', fontSize: '14px', color: '#888888' }}
                />
                <Bar dataKey="input" name="Input Tokens" stackId="a" fill="#f97316" barSize={12} />
                <Bar dataKey="output" name="Output Tokens" stackId="a" fill="#3b82f6" barSize={12} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards (Separated below) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Most Active */}
        <div className="bg-card border border-border p-4 rounded-xl shadow-sm flex items-start gap-4">
          <div className="p-2.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground">Most Active Day</span>
            <span className="text-xs text-muted-foreground mt-0.5">Oct 1, 2026</span>
            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              1,220,000 <span className="text-xs font-normal">tokens</span>
            </span>
          </div>
        </div>

        {/* Least Used */}
        <div className="bg-card border border-border p-4 rounded-xl shadow-sm flex items-start gap-4">
          <div className="p-2.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground">Least Used Day</span>
            <span className="text-xs text-muted-foreground mt-0.5">Oct 4, 2026</span>
            <span className="text-lg font-bold text-rose-600 dark:text-rose-400 mt-1">
              0 <span className="text-xs font-normal">tokens</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
