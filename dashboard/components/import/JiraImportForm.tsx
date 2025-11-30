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
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.575 24V12.518a1.005 1.005 0 0 0-1.005-1.005z" />
            <path
              d="M5.024 5.7H16.59a5.218 5.218 0 0 1-5.232 5.215h-2.13v2.057A5.215 5.215 0 0 1 4.02 18.18V6.71A1.005 1.005 0 0 1 5.024 5.7z"
              opacity="0.75"
            />
            <path
              d="M10.468 0h11.572a5.218 5.218 0 0 1-5.232 5.215h-2.13v2.057A5.215 5.215 0 0 1 9.464 12.49V1.005A1.005 1.005 0 0 1 10.468 0z"
              opacity="0.5"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-semibold">Jira Configuration</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Connect to your Jira project to import tickets
          </p>
        </div>
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="projectKey">Jira Project Key</Label>
          <Input
            id="projectKey"
            value={projectKey}
            onChange={(e) => setProjectKey(e.target.value.toUpperCase())}
            placeholder="e.g., KAFKA"
            required
            className="font-mono"
          />
          <p className="text-xs text-muted-foreground">
            The project key is the prefix of your ticket IDs (e.g., KAFKA-1234)
          </p>
        </div>

        {importType === 'sprint' && (
          <div className="space-y-2">
            <Label htmlFor="sprintId">Sprint ID</Label>
            <Input
              id="sprintId"
              value={sprintId}
              onChange={(e) => setSprintId(e.target.value)}
              placeholder="e.g., 12345"
              required
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Find the sprint ID in your Jira board settings or URL
            </p>
          </div>
        )}

        {importType === 'ticket' && (
          <div className="space-y-2">
            <Label htmlFor="ticketKey">Ticket Key</Label>
            <Input
              id="ticketKey"
              value={ticketKey}
              onChange={(e) => setTicketKey(e.target.value.toUpperCase())}
              placeholder="e.g., KAFKA-19734"
              required
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              The full ticket ID including the project prefix
            </p>
          </div>
        )}

        {importType === 'feature' && (
          <div className="space-y-2">
            <Label htmlFor="label">Jira Label</Label>
            <Input
              id="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g., feature-checkout"
              required
            />
            <p className="text-xs text-muted-foreground">
              Import all tickets with this label from the project
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="submit">Next</Button>
      </div>
    </form>
  );
}
