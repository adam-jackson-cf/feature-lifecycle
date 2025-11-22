'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMetrics } from '@/lib/hooks/useMetrics';

interface EffortComplexityViewProps {
  caseStudyId: string;
}

export function EffortComplexityView({ caseStudyId }: EffortComplexityViewProps) {
  const [showAIOnly, setShowAIOnly] = useState(false);
  const { data, isLoading } = useMetrics(caseStudyId);
  const complexityData = data?.complexity;

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
          </div>
        )}
      </CardContent>
    </Card>
  );
}
