'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMetrics } from '@/lib/hooks/useMetrics';
import type { DisciplineEffortMetric } from '@/lib/types';

interface EffortComplexityViewProps {
  caseStudyId: string;
}

export function EffortComplexityView({ caseStudyId }: EffortComplexityViewProps) {
  const [showAIOnly, setShowAIOnly] = useState(false);
  const { data, isLoading } = useMetrics(caseStudyId);
  const complexityData = data?.complexity;
  const disciplineEffort = (data?.disciplineEffort || []) as DisciplineEffortMetric[];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Effort by Complexity & Discipline</CardTitle>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showAIOnly}
              onChange={(e) => setShowAIOnly(e.target.checked)}
            />
            Show AI-assisted only
          </label>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading || !complexityData ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3">By Complexity Size</h3>
              <div className="grid grid-cols-5 gap-2">
                {Object.entries(complexityData.bySize).map(([size, count]) => (
                  <div key={size} className="text-center">
                    <Badge variant={size === 'XL' ? 'destructive' : 'default'}>{size}</Badge>
                    <p className="text-2xl font-bold mt-2">{count}</p>
                  </div>
                ))}
              </div>
              {complexityData.oversize > 0 && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                  ⚠️ {complexityData.oversize} oversize ticket(s) detected
                </p>
              )}
            </div>
            <div>
              <h3 className="font-semibold mb-3">By Discipline</h3>
              <div className="grid grid-cols-3 gap-4">
                {Object.entries(complexityData.byDiscipline).map(([discipline, count]) => (
                  <div key={discipline} className="text-center">
                    <p className="text-sm text-muted-foreground capitalize">{discipline}</p>
                    <p className="text-2xl font-bold">{count}</p>
                  </div>
                ))}
              </div>
            </div>

            {disciplineEffort.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Discipline Effort (lead/cycle/flow)</h3>
                  <p className="text-xs text-muted-foreground">
                    Hours · % efficiency · oversize rate
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-muted-foreground">
                      <tr>
                        <th className="py-2 pr-3">Discipline</th>
                        <th className="py-2 pr-3">Lead (p50)</th>
                        <th className="py-2 pr-3">Cycle (p50)</th>
                        <th className="py-2 pr-3">Active</th>
                        <th className="py-2 pr-3">Queue</th>
                        <th className="py-2 pr-3">Efficiency</th>
                        <th className="py-2 pr-3">Oversize</th>
                        <th className="py-2 pr-3">Reopens</th>
                      </tr>
                    </thead>
                    <tbody>
                      {disciplineEffort.map((row) => (
                        <tr
                          key={row.discipline}
                          className="border-t border-muted/40 dark:border-muted/20"
                        >
                          <td className="py-2 pr-3 capitalize">{row.discipline}</td>
                          <td className="py-2 pr-3">{row.leadTimeMedianHours.toFixed(1)}h</td>
                          <td className="py-2 pr-3">{row.cycleTimeMedianHours.toFixed(1)}h</td>
                          <td className="py-2 pr-3">{row.activeHours.toFixed(1)}h</td>
                          <td className="py-2 pr-3">{row.queueHours.toFixed(1)}h</td>
                          <td className="py-2 pr-3">{row.efficiencyPercent.toFixed(1)}%</td>
                          <td className="py-2 pr-3">{Math.round(row.oversizeRate * 100)}%</td>
                          <td className="py-2 pr-3">{row.reopenCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
