'use client';

import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImportTypeCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
  className?: string;
}

export function ImportTypeCard({
  icon: Icon,
  title,
  description,
  onClick,
  className,
}: ImportTypeCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group flex items-start gap-4 w-full p-4 rounded-lg border border-border bg-card text-left',
        'transition-all duration-200',
        'hover:border-primary/50 hover:bg-primary/5 hover:shadow-sm',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        className
      )}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="mt-0.5 text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </button>
  );
}
