'use client';

import { Badge } from '@/components/ui/badge';
import type { PhaseDistribution } from '@/lib/types';

interface PhaseDistributionTableProps {
  data: PhaseDistribution;
}

export function PhaseDistributionTable({ data }: PhaseDistributionTableProps) {
  if (data.phases.length === 0) {
    return (
      <div className="py-4 text-center text-sm text-muted-foreground">No phase data available</div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-left text-muted-foreground">
          <tr>
            <th className="py-2 pr-3">Phase</th>
            <th className="py-2 pr-3 text-right">Tickets</th>
            <th className="py-2 pr-3 text-right">Hours</th>
            <th className="py-2 pr-3 text-right">% of Total</th>
          </tr>
        </thead>
        <tbody>
          {data.phases.map((phase) => (
            <tr key={phase.phase} className="border-t border-muted/40 dark:border-muted/20">
              <td className="py-2 pr-3">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: phase.color }} />
                  <span>{phase.label}</span>
                </div>
              </td>
              <td className="py-2 pr-3 text-right">{phase.ticketCount}</td>
              <td className="py-2 pr-3 text-right">{phase.totalHours.toFixed(1)}h</td>
              <td className="py-2 pr-3 text-right">
                <Badge variant={phase.percentage > 25 ? 'default' : 'secondary'}>
                  {phase.percentage.toFixed(1)}%
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="border-t-2 font-medium">
          <tr>
            <td className="py-2 pr-3">Total</td>
            <td className="py-2 pr-3 text-right">{data.totalTickets}</td>
            <td className="py-2 pr-3 text-right">{data.totalHours.toFixed(1)}h</td>
            <td className="py-2 pr-3 text-right">
              <Badge variant="outline">100%</Badge>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
