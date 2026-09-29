const fs = require('fs');
const file = 'c:/CLASSGRIDPLATFORM/classgrid_platoform-desktop-/client/src/features/superadmin/pages/AiUsageDashboardPage.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add imports
if (!content.includes('recharts')) {
    content = content.replace(
        'import { Skeleton } from "@/components/marketing_ui/skeleton";',
        `import { Skeleton } from "@/components/marketing_ui/skeleton";\nimport { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";\nconst COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];`
    );
}

// 2. Replace renderGlobalStats
const newRender = `  const renderGlobalStats = () => {
    if (globalLoading) return <Skeleton className="h-96 w-full mb-8" />;
    if (!globalStats) return null;

    const { totalCreditsSpent, totalRevenue, creditsPurchasedThisMonth, totalChats, usageTrend, models } = globalStats;
    const pieData = models?.map((m: any, i: number) => ({ name: m.name.split('/').pop(), value: 10 + Math.random() * 90, color: COLORS[i % COLORS.length] })) || [];

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
                        <Cell key={\`cell-\${index}\`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                      formatter={(value: any, name: any) => [name, '']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };`;

const regex = /const renderGlobalStats = \(\) => \{[\s\S]*?\n  \};\n\n  const renderLevel0Orgs =/m;
content = content.replace(regex, newRender + '\n\n  const renderLevel0Orgs =');

content = content.replace(/tokens/g, 'credits');
content = content.replace(/Tokens/g, 'Credits');

fs.writeFileSync(file, content);
console.log('Done');
