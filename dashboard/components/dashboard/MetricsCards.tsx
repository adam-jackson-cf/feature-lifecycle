import { CheckCircle2, Clock, GitCommit, GitPullRequest, Ticket, Timer, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { MetricsSummary } from '@/lib/types';

interface MetricsCardsProps {
  metrics: MetricsSummary;
}

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  variant?: 'default' | 'primary' | 'accent';
  description?: string;
}

function MetricCard({ label, value, icon, variant = 'default', description }: MetricCardProps) {
  const isEmpty = value === 0 || value === '0.0 days';

  const variantStyles = {
    default: 'bg-card',
    primary: 'bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20',
    accent: 'bg-gradient-to-br from-accent/10 via-accent/5 to-transparent border-accent/20',
  };

  const iconStyles = {
    default: 'text-muted-foreground',
    primary: 'text-primary',
    accent: 'text-accent',
  };

  return (
    <Card
      className={`relative overflow-hidden transition-all hover:shadow-md ${variantStyles[variant]}`}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {label}
            </p>
            <p
              className={`text-2xl font-bold tabular-nums ${isEmpty ? 'text-muted-foreground/50' : ''}`}
            >
              {isEmpty ? '—' : value}
            </p>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
          <div className={`rounded-lg p-2.5 bg-muted/50 ${iconStyles[variant]}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export function MetricsCards({ metrics }: MetricsCardsProps) {
  const formatTime = (ms: number): string => {
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    return `${days.toFixed(1)} days`;
  };

  return (
    <div className="space-y-4 mb-8">
      {/* Primary metrics row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Cycle Time"
          value={formatTime(metrics.avgCycleTime)}
          icon={<Timer className="h-5 w-5" />}
          variant="primary"
          description="Avg work duration"
        />
        <MetricCard
          label="Lead Time"
          value={formatTime(metrics.avgLeadTime)}
          icon={<Clock className="h-5 w-5" />}
          variant="primary"
          description="Avg total duration"
        />
        <MetricCard
          label="Total Tickets"
          value={metrics.totalTickets}
          icon={<Ticket className="h-5 w-5" />}
        />
        <MetricCard
          label="Completed"
          value={metrics.completedTickets}
          icon={<CheckCircle2 className="h-5 w-5" />}
          variant="accent"
        />
      </div>
      {/* Secondary metrics row */}
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Commits"
          value={metrics.totalCommits}
          icon={<GitCommit className="h-5 w-5" />}
        />
        <MetricCard
          label="Pull Requests"
          value={metrics.totalPRs}
          icon={<GitPullRequest className="h-5 w-5" />}
        />
        <MetricCard
          label="Velocity Points"
          value={metrics.velocityPoints}
          icon={<Zap className="h-5 w-5" />}
        />
      </div>
    </div>
  );
}
