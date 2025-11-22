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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="owner">GitHub Owner</Label>
        <Input
          id="owner"
          value={owner}
          onChange={(e) => setOwner(e.target.value)}
          placeholder="e.g., apache"
          required
        />
      </div>

      <div>
        <Label htmlFor="repo">Repository Name</Label>
        <Input
          id="repo"
          value={repo}
          onChange={(e) => setRepo(e.target.value)}
          placeholder="e.g., kafka"
          required
        />
      </div>

      <div className="flex gap-4">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="submit">Next</Button>
      </div>
    </form>
  );
}
