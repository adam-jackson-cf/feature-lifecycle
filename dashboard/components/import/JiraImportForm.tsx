'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface JiraImportFormProps {
  importType: 'project' | 'sprint' | 'ticket' | 'feature';
  onSubmit: (data: {
    projectKey: string;
    sprintId?: string;
    ticketKey?: string;
    label?: string;
  }) => void;
  onBack: () => void;
}

export function JiraImportForm({ importType, onSubmit, onBack }: JiraImportFormProps) {
  const [projectKey, setProjectKey] = useState('');
  const [sprintId, setSprintId] = useState('');
  const [ticketKey, setTicketKey] = useState('');
  const [label, setLabel] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      projectKey,
      sprintId: importType === 'sprint' ? sprintId : undefined,
      ticketKey: importType === 'ticket' ? ticketKey : undefined,
      label: importType === 'feature' ? label : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="projectKey">Jira Project Key</Label>
        <Input
          id="projectKey"
          value={projectKey}
          onChange={(e) => setProjectKey(e.target.value)}
          placeholder="e.g., KAFKA"
          required
        />
      </div>

      {importType === 'sprint' && (
        <div>
          <Label htmlFor="sprintId">Sprint ID</Label>
          <Input
            id="sprintId"
            value={sprintId}
            onChange={(e) => setSprintId(e.target.value)}
            placeholder="e.g., 12345"
            required
          />
        </div>
      )}

      {importType === 'ticket' && (
        <div>
          <Label htmlFor="ticketKey">Ticket Key</Label>
          <Input
            id="ticketKey"
            value={ticketKey}
            onChange={(e) => setTicketKey(e.target.value)}
            placeholder="e.g., KAFKA-19734"
            required
          />
        </div>
      )}

      {importType === 'feature' && (
        <div>
          <Label htmlFor="label">Jira Label</Label>
          <Input
            id="label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g., feature-checkout"
            required
          />
          <p className="text-xs text-muted-foreground mt-1">
            Import all tickets with this label from the project
          </p>
        </div>
      )}

      <div className="flex gap-4">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="submit">Next</Button>
      </div>
    </form>
  );
}
