'use client';

import { CheckCircle2, Clock, Code2, Ticket, Timer, Zap } from 'lucide-react';
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
  index: number;
}

function MetricCard({
  label,
  value,
  icon,
  variant = 'default',
  description,
  index,
}: MetricCardProps) {
  const isEmpty = value === 0 || value === '0.0d' || value === '—';

  const variantStyles = {
    default: 'bg-card',
    primary: 'bg-gradient-to-br from-primary/10 via-primary/5 to-transparent',
    accent: 'bg-gradient-to-br from-accent/10 via-accent/5 to-transparent',
  };

  const iconStyles = {
    default: 'text-muted-foreground',
    primary: 'text-primary',
    accent: 'text-accent',
  };

  const valueStyles = {
    default: 'text-foreground',
    primary: 'text-primary',
    accent: 'text-accent',
  };

  return (
    <div
      className={`
        group relative overflow-hidden rounded-xl border border-border/50
        ${variantStyles[variant]}
        glass shadow-glass
        transition-premium
        hover:-translate-y-0.5 hover:shadow-glass-hover
        animate-fade-in-up stagger-${index + 1}
      `}
    >
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/0 group-hover:from-white/5 group-hover:to-transparent transition-all duration-300 dark:group-hover:from-white/[0.02]" />

      <div className="relative p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
              {label}
            </p>
            <p
              className={`
                text-2xl font-bold font-display tabular-nums tracking-tight
                ${isEmpty ? 'text-muted-foreground/40' : valueStyles[variant]}
              `}
            >
              {isEmpty ? '—' : value}
            </p>
            {description && (
              <p className="text-xs text-muted-foreground mt-1 truncate">{description}</p>
            )}
          </div>
          <div
            className={`
              flex-shrink-0 p-2.5 rounded-lg
              ${variant === 'primary' ? 'bg-primary/10' : variant === 'accent' ? 'bg-accent/10' : 'bg-muted'}
              transition-colors duration-200
            `}
          >
            <span className={iconStyles[variant]}>{icon}</span>
          </div>
        </div>
      </div>

      {/* Accent line for primary/accent variants */}
      {variant !== 'default' && (
        <div
          className={`
            absolute bottom-0 left-0 right-0 h-0.5
            ${variant === 'primary' ? 'bg-gradient-to-r from-primary/50 via-primary to-primary/50' : 'bg-gradient-to-r from-accent/50 via-accent to-accent/50'}
          `}
        />
      )}
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
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 mb-8">
      <MetricCard
        label="Cycle Time"
        value={formatTime(metrics.avgCycleTime)}
        icon={<Timer className="h-5 w-5" />}
        variant="primary"
        description="Avg. work duration"
        index={0}
      />
      <MetricCard
        label="Lead Time"
        value={formatTime(metrics.avgLeadTime)}
        icon={<Clock className="h-5 w-5" />}
        variant="primary"
        description="Request to delivery"
        index={1}
      />
      <MetricCard
        label="Total Tickets"
        value={metrics.totalTickets}
        icon={<Ticket className="h-5 w-5" />}
        description="In scope"
        index={2}
      />
      <MetricCard
        label="Completed"
        value={metrics.completedTickets}
        icon={<CheckCircle2 className="h-5 w-5" />}
        variant="accent"
        description="Resolved items"
        index={3}
      />
      <MetricCard
        label="Dev Activity"
        value={devActivity}
        icon={<Code2 className="h-5 w-5" />}
        description="Commits + PRs"
        index={4}
      />
      <MetricCard
        label="Velocity"
        value={metrics.velocityPoints}
        icon={<Zap className="h-5 w-5" />}
        description="Story points"
        index={5}
      />
    </div>
  );
}
