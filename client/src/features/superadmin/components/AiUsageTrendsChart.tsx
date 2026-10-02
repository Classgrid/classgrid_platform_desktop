import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/marketing_ui/card";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";

const DUMMY_DATA = [
  { label: 'Mon', value: 8000 },
  { label: 'Tue', value: 9200 },
  { label: 'Wed', value: 14000 }, // Most Active
  { label: 'Thu', value: 11000 },
  { label: 'Fri', value: 6000 },
  { label: 'Sat', value: 1500 },
  { label: 'Sun', value: 200 },  // Least Used
];

const MAX_VAL = Math.max(...DUMMY_DATA.map(d => d.value));

export function AiUsageTrendsChart() {
  return (
    <Card className="border border-border shadow-sm overflow-hidden">
      <CardHeader className="bg-muted/10 border-b border-border pb-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-500" />
          7-Day Platform Usage Trends
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-8 items-center">
          
          {/* Left: CSS Bar Chart */}
          <div className="flex-1 w-full h-[200px] flex items-end gap-3 justify-between border-b border-border/50 pb-2 relative">
            {DUMMY_DATA.map((day, idx) => {
              const isMax = day.value === MAX_VAL;
              const heightPercent = Math.max((day.value / MAX_VAL) * 100, 5); // min 5% height
              
              return (
                <div key={idx} className="flex flex-col items-center gap-2 flex-1 group">
                  <div className="relative w-full h-[160px] flex items-end justify-center">
                    {/* Tooltip */}
                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-foreground text-background text-xs py-1 px-2 rounded-md pointer-events-none whitespace-nowrap z-10">
                      {day.value.toLocaleString()} tokens
                    </div>
                    
                    {/* Bar */}
                    <div 
                      className={`w-full max-w-[40px] rounded-t-sm transition-all duration-500 ${isMax ? 'bg-blue-500' : 'bg-blue-500/20 hover:bg-blue-500/40'}`}
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground uppercase">{day.label}</span>
                </div>
              );
            })}
          </div>

          {/* Right: Stats Cards */}
          <div className="w-full md:w-[280px] shrink-0 flex flex-col gap-4">
            
            {/* Most Active */}
            <div className="bg-card border border-border p-4 rounded-xl shadow-sm flex items-start gap-4">
              <div className="p-2.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-foreground">Most Active Day</span>
                <span className="text-xs text-muted-foreground mt-0.5">Wed, 24 Oct</span>
                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  14,000 <span className="text-xs font-normal">tokens</span>
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
                <span className="text-xs text-muted-foreground mt-0.5">Sun, 23 Oct</span>
                <span className="text-lg font-bold text-rose-600 dark:text-rose-400 mt-1">
                  200 <span className="text-xs font-normal">tokens</span>
                </span>
              </div>
            </div>

          </div>
        </div>
      </CardContent>
    </Card>
  );
}
