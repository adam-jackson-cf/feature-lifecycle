import { CheckCircle2, Clock, Code2, Ticket, Timer, Zap } from 'lucide-react';
import type { MetricsSummary } from '@/lib/types';

interface MetricsCardsProps {
  metrics: MetricsSummary;
}

interface MetricItemProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  variant?: 'default' | 'primary' | 'accent';
}

function MetricItem({ label, value, icon, variant = 'default' }: MetricItemProps) {
  const isEmpty = value === 0 || value === '0.0d';

  const valueStyles = {
    default: '',
    primary: 'text-primary',
    accent: 'text-accent',
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground">{icon}</span>
      <span
        className={`font-bold tabular-nums ${isEmpty ? 'text-muted-foreground/50' : valueStyles[variant]}`}
      >
        {isEmpty ? '—' : value}
      </span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

export function MetricsCards({ metrics }: MetricsCardsProps) {
  const formatTime = (ms: number): string => {
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    return `${days.toFixed(1)}d`;
  };

  const devActivity = metrics.totalCommits + metrics.totalPRs;

  return (
    <div className="mb-6 rounded-lg border bg-card px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <MetricItem
          label="Cycle"
          value={formatTime(metrics.avgCycleTime)}
          icon={<Timer className="h-4 w-4" />}
          variant="primary"
        />
        <div className="h-4 w-px bg-border" />
        <MetricItem
          label="Lead"
          value={formatTime(metrics.avgLeadTime)}
          icon={<Clock className="h-4 w-4" />}
          variant="primary"
        />
        <div className="h-4 w-px bg-border" />
        <MetricItem
          label="Tickets"
          value={metrics.totalTickets}
          icon={<Ticket className="h-4 w-4" />}
        />
        <div className="h-4 w-px bg-border" />
        <MetricItem
          label="Done"
          value={metrics.completedTickets}
          icon={<CheckCircle2 className="h-4 w-4" />}
          variant="accent"
        />
        <div className="h-4 w-px bg-border" />
        <MetricItem label="Dev Activity" value={devActivity} icon={<Code2 className="h-4 w-4" />} />
        <div className="h-4 w-px bg-border" />
        <MetricItem
          label="Velocity"
          value={metrics.velocityPoints}
          icon={<Zap className="h-4 w-4" />}
        />
      </div>
    </div>
  );
}
