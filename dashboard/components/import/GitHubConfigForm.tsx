'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface GitHubConfigFormProps {
  onSubmit: (data: { owner: string; repo: string }) => void;
  onBack: () => void;
}

export function GitHubConfigForm({ onSubmit, onBack }: GitHubConfigFormProps) {
  const [owner, setOwner] = useState('');
  const [repo, setRepo] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ owner, repo });
  };

  const previewUrl = owner && repo ? `github.com/${owner}/${repo}` : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-foreground/10 text-foreground">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-semibold">GitHub Configuration</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Link the repository containing commits and PRs
          </p>
        </div>
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="owner">GitHub Owner</Label>
          <Input
            id="owner"
            value={owner}
            onChange={(e) => setOwner(e.target.value.toLowerCase())}
            placeholder="e.g., apache"
            required
            className="font-mono"
          />
          <p className="text-xs text-muted-foreground">
            The organization or username that owns the repository
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="repo">Repository Name</Label>
          <Input
            id="repo"
            value={repo}
            onChange={(e) => setRepo(e.target.value.toLowerCase())}
            placeholder="e.g., kafka"
            required
            className="font-mono"
          />
          <p className="text-xs text-muted-foreground">
            The name of the repository (without the owner prefix)
          </p>
        </div>

        {/* Preview */}
        {previewUrl && (
          <div className="p-3 rounded-lg border border-border bg-muted/30">
            <p className="text-xs text-muted-foreground mb-1">Repository URL</p>
            <p className="text-sm font-mono text-foreground">{previewUrl}</p>
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
