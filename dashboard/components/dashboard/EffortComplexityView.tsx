'use client';

import { Layers } from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CHART_COLORS } from '@/lib/constants/chart-colors';
import { useMetrics } from '@/lib/hooks/useMetrics';

interface EffortComplexityViewProps {
  caseStudyId: string;
}

interface SizeDatum {
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
  payload?: Array<{ payload: SizeDatum }>;
}) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="glass-strong rounded-lg border border-border/50 px-4 py-3 shadow-glass">
      <p className="text-sm font-semibold font-display text-foreground">Size: {data.name}</p>
      <p className="text-xs text-muted-foreground mt-1">
        Count: <span className="font-medium text-foreground tabular-nums">{data.value}</span>
      </p>
    </div>
  );
}

export function EffortComplexityView({ caseStudyId }: EffortComplexityViewProps) {
  const { data, isLoading } = useMetrics(caseStudyId);
  const complexityData = data?.complexity;

  if (isLoading) {
    return (
      <Card className="glass shadow-glass animate-fade-in-up stagger-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <div className="p-1.5 rounded-md bg-accent/10">
              <Layers className="h-4 w-4 text-accent" />
            </div>
            Effort by Complexity
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

  if (!complexityData) {
    return (
      <Card className="glass shadow-glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <div className="p-1.5 rounded-md bg-accent/10">
              <Layers className="h-4 w-4 text-accent" />
            </div>
            Effort by Complexity
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[280px] flex items-center justify-center">
          <p className="text-sm text-muted-foreground">No complexity data available</p>
        </CardContent>
      </Card>
    );
  }

  const sizeOrder = ['XS', 'S', 'M', 'L', 'XL'];
  const chartData: SizeDatum[] = sizeOrder
    .map((size, index) => ({
      name: size,
      value: (complexityData.bySize as Record<string, number>)[size] || 0,
      color: CHART_COLORS[index % CHART_COLORS.length],
    }))
    .filter((item) => item.value > 0);

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className="glass shadow-glass animate-fade-in-up stagger-3 transition-premium hover:shadow-glass-hover">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-display">
          <div className="p-1.5 rounded-md bg-accent/10">
            <Layers className="h-4 w-4 text-accent" />
          </div>
          Effort by Complexity
        </CardTitle>
        <p className="text-xs text-muted-foreground">Ticket distribution by size</p>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <div className="flex-1 min-w-0 relative">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <defs>
                  {chartData.map((entry, index) => (
                    <linearGradient
                      key={`complexity-gradient-${index}`}
                      id={`complexity-gradient-${index}`}
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
                  animationBegin={200}
                  animationDuration={800}
                  animationEasing="ease-out"
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={`url(#complexity-gradient-${index})`}
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
                  {total}
                </p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Tickets</p>
              </div>
            </div>
          </div>
          {/* Legend */}
          <div className="w-[160px] shrink-0 space-y-2 max-h-[260px] overflow-y-auto pr-2">
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
                    <p className="text-sm font-semibold leading-none">{entry.name}</p>
                    <p className="text-xs text-muted-foreground mt-1 tabular-nums">
                      {entry.value} · {percentage}%
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {complexityData.oversize > 0 && (
          <div className="mt-4 flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <span className="text-sm text-destructive font-medium">
              {complexityData.oversize} oversize ticket{complexityData.oversize > 1 ? 's' : ''}{' '}
              detected
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
