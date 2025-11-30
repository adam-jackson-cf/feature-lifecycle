'use client';

import { Users } from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CHART_COLORS } from '@/lib/constants/chart-colors';
import { useMetrics } from '@/lib/hooks/useMetrics';

interface DisciplineDistributionChartProps {
  caseStudyId: string;
}

interface DisciplineDatum {
  name: string;
  value: number;
  color: string;
  [key: string]: unknown;
}

function PremiumTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: DisciplineDatum }>;
}) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="glass-strong rounded-lg border border-border/50 px-4 py-3 shadow-glass">
      <p className="text-sm font-semibold font-display text-foreground capitalize">{data.name}</p>
      <p className="text-xs text-muted-foreground mt-1">
        Tickets: <span className="font-medium text-foreground tabular-nums">{data.value}</span>
      </p>
    </div>
  );
}

export function DisciplineDistributionChart({ caseStudyId }: DisciplineDistributionChartProps) {
  const { data, isLoading } = useMetrics(caseStudyId);
  const complexityData = data?.complexity;

  if (isLoading) {
    return (
      <Card className="glass shadow-glass animate-fade-in-up stagger-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <div className="p-1.5 rounded-md bg-accent/10">
              <Users className="h-4 w-4 text-accent" />
            </div>
            Discipline Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[280px] flex items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 rounded-full border-2 border-accent border-t-transparent animate-spin" />
            <span className="text-muted-foreground text-sm">Loading chart...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!complexityData?.byDiscipline) {
    return (
      <Card className="glass shadow-glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <div className="p-1.5 rounded-md bg-accent/10">
              <Users className="h-4 w-4 text-accent" />
            </div>
            Discipline Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[280px] flex items-center justify-center">
          <p className="text-sm text-muted-foreground">No discipline data available</p>
        </CardContent>
      </Card>
    );
  }

  const chartData: DisciplineDatum[] = Object.entries(complexityData.byDiscipline)
    .map(([discipline, count], index) => ({
      name: discipline,
      value: count as number,
      color: CHART_COLORS[index % CHART_COLORS.length],
    }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  if (chartData.length === 0) {
    return (
      <Card className="glass shadow-glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <div className="p-1.5 rounded-md bg-accent/10">
              <Users className="h-4 w-4 text-accent" />
            </div>
            Discipline Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[280px] flex items-center justify-center">
          <p className="text-sm text-muted-foreground">No discipline data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass shadow-glass animate-fade-in-up stagger-4 transition-premium hover:shadow-glass-hover">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-display">
          <div className="p-1.5 rounded-md bg-accent/10">
            <Users className="h-4 w-4 text-accent" />
          </div>
          Discipline Distribution
        </CardTitle>
        <p className="text-xs text-muted-foreground">Tickets by engineering discipline</p>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <div className="flex-1 min-w-0 relative">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <defs>
                  {chartData.map((entry, index) => (
                    <linearGradient
                      key={`discipline-gradient-${index}`}
                      id={`discipline-gradient-${index}`}
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="1"
                    >
                      <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
                      <stop offset="100%" stopColor={entry.color} stopOpacity={0.7} />
                    </linearGradient>
                  ))}
                </defs>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={105}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                  animationBegin={300}
                  animationDuration={800}
                  animationEasing="ease-out"
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={`url(#discipline-gradient-${index})`}
                      className="transition-all duration-200 hover:opacity-80"
                      style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
                    />
                  ))}
                </Pie>
                <Tooltip content={<PremiumTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <p className="text-2xl font-bold font-display tabular-nums text-foreground">
                  {chartData.length}
                </p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Disciplines
                </p>
              </div>
            </div>
          </div>
          {/* Legend */}
          <div className="w-[180px] shrink-0 space-y-2 max-h-[260px] overflow-y-auto pr-2">
            {chartData.map((entry, index) => {
              const percentage = total > 0 ? ((entry.value / total) * 100).toFixed(0) : 0;
              return (
                <div
                  key={entry.name}
                  className="group flex items-center gap-3 p-2 rounded-lg transition-colors hover:bg-muted/50 cursor-default animate-fade-in-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div
                    className="h-3 w-3 rounded-full shrink-0 transition-transform group-hover:scale-110"
                    style={{
                      backgroundColor: entry.color,
                      boxShadow: `0 0 0 2px var(--card), 0 0 0 4px ${entry.color}40`,
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-none capitalize truncate">
                      {entry.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 tabular-nums">
                      {entry.value} · {percentage}%
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
