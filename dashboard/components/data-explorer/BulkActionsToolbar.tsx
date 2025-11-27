'use client';

import { Check, Loader2, Tag, XCircle } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LIFECYCLE_PHASE_LABELS, LIFECYCLE_PHASES } from '@/lib/types';

interface BulkActionsToolbarProps {
  selectedCount: number;
  onAction: (updates: {
    phaseOverride?: string | null;
    disciplineOverride?: string | null;
    complexityOverride?: string | null;
    excludedFromMetrics?: boolean;
  }) => Promise<void>;
  isLoading?: boolean;
}

const DISCIPLINES = ['backend', 'frontend', 'mobile', 'data', 'devops', 'qa'];
const COMPLEXITIES = ['XS', 'S', 'M', 'L', 'XL'] as const;

export function BulkActionsToolbar({
  selectedCount,
  onAction,
  isLoading,
}: BulkActionsToolbarProps) {
  const [phaseValue, setPhaseValue] = useState<string>('');
  const [disciplineValue, setDisciplineValue] = useState<string>('');
  const [complexityValue, setComplexityValue] = useState<string>('');

  const handleSetPhase = async () => {
    if (!phaseValue) return;
    await onAction({ phaseOverride: phaseValue === 'clear' ? null : phaseValue });
    setPhaseValue('');
  };

  const handleSetDiscipline = async () => {
    if (!disciplineValue) return;
    await onAction({ disciplineOverride: disciplineValue === 'clear' ? null : disciplineValue });
    setDisciplineValue('');
  };

  const handleSetComplexity = async () => {
    if (!complexityValue) return;
    await onAction({
      complexityOverride:
        complexityValue === 'clear' ? null : (complexityValue as 'XS' | 'S' | 'M' | 'L' | 'XL'),
    });
    setComplexityValue('');
  };

  const handleExclude = () => onAction({ excludedFromMetrics: true });
  const handleInclude = () => onAction({ excludedFromMetrics: false });

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border bg-muted/50 p-3">
      <span className="mr-2 text-sm font-medium">{selectedCount} selected</span>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" disabled={isLoading}>
            <Tag className="mr-1 h-4 w-4" />
            Set Phase
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-3">
          <div className="space-y-2">
            <Select value={phaseValue} onValueChange={setPhaseValue}>
              <SelectTrigger>
                <SelectValue placeholder="Select phase" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="clear">Clear Override</SelectItem>
                {LIFECYCLE_PHASES.map((phase) => (
                  <SelectItem key={phase} value={phase}>
                    {LIFECYCLE_PHASE_LABELS[phase]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              className="w-full"
              onClick={handleSetPhase}
              disabled={!phaseValue || isLoading}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" disabled={isLoading}>
            <Tag className="mr-1 h-4 w-4" />
            Set Discipline
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[180px] p-3">
          <div className="space-y-2">
            <Select value={disciplineValue} onValueChange={setDisciplineValue}>
              <SelectTrigger>
                <SelectValue placeholder="Select discipline" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="clear">Clear Override</SelectItem>
                {DISCIPLINES.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              className="w-full"
              onClick={handleSetDiscipline}
              disabled={!disciplineValue || isLoading}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" disabled={isLoading}>
            <Tag className="mr-1 h-4 w-4" />
            Set Complexity
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[160px] p-3">
          <div className="space-y-2">
            <Select value={complexityValue} onValueChange={setComplexityValue}>
              <SelectTrigger>
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="clear">Clear Override</SelectItem>
                {COMPLEXITIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              className="w-full"
              onClick={handleSetComplexity}
              disabled={!complexityValue || isLoading}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <div className="h-4 w-px bg-border" />

      <Button variant="outline" size="sm" onClick={handleExclude} disabled={isLoading}>
        <XCircle className="mr-1 h-4 w-4" />
        Exclude
      </Button>

      <Button variant="outline" size="sm" onClick={handleInclude} disabled={isLoading}>
        <Check className="mr-1 h-4 w-4" />
        Include
      </Button>

      {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin text-muted-foreground" />}
    </div>
  );
}
