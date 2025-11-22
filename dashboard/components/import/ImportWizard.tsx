'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GitHubConfigForm } from './GitHubConfigForm';
import { JiraImportForm } from './JiraImportForm';

type ImportType = 'project' | 'sprint' | 'ticket';

interface ImportData {
  type: ImportType;
  jira: {
    projectKey: string;
    sprintId?: string;
    ticketKey?: string;
  };
  github: {
    owner: string;
    repo: string;
  };
  useMock: boolean;
}

export function ImportWizard() {
  const [step, setStep] = useState(1);
  const [importData, setImportData] = useState<Partial<ImportData>>({});

  const handleTypeSelect = (type: ImportType) => {
    setImportData({ ...importData, type });
    setStep(2);
  };

  const handleJiraSubmit = (jiraData: ImportData['jira']) => {
    setImportData({ ...importData, jira: jiraData });
    setStep(3);
  };

  const handleGitHubSubmit = (githubData: ImportData['github']) => {
    setImportData({ ...importData, github: githubData });
    setStep(4);
  };

  const handleImport = async () => {
    // TODO: Implement actual import
    console.log('Importing with data:', importData);
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Import Wizard</CardTitle>
      </CardHeader>
      <CardContent>
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Select Import Type</h2>
            <div className="grid gap-4">
              <Button
                variant="outline"
                onClick={() => handleTypeSelect('project')}
                className="h-auto p-4 text-left"
              >
                <div>
                  <div className="font-semibold">Project</div>
                  <div className="text-sm text-zinc-500">
                    Import all tickets from a Jira project
                  </div>
                </div>
              </Button>
              <Button
                variant="outline"
                onClick={() => handleTypeSelect('sprint')}
                className="h-auto p-4 text-left"
              >
                <div>
                  <div className="font-semibold">Sprint</div>
                  <div className="text-sm text-zinc-500">Import tickets from a specific sprint</div>
                </div>
              </Button>
              <Button
                variant="outline"
                onClick={() => handleTypeSelect('ticket')}
                className="h-auto p-4 text-left"
              >
                <div>
                  <div className="font-semibold">Single Ticket</div>
                  <div className="text-sm text-zinc-500">Import a single Jira ticket</div>
                </div>
              </Button>
            </div>
          </div>
        )}

        {step === 2 && importData.type && (
          <JiraImportForm
            importType={importData.type}
            onSubmit={handleJiraSubmit}
            onBack={() => setStep(1)}
          />
        )}

        {step === 3 && <GitHubConfigForm onSubmit={handleGitHubSubmit} onBack={() => setStep(2)} />}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Review & Confirm</h2>
            <div className="space-y-2">
              <p>
                <strong>Type:</strong> {importData.type}
              </p>
              <p>
                <strong>Jira Project:</strong> {importData.jira?.projectKey}
              </p>
              {importData.jira?.sprintId && (
                <p>
                  <strong>Sprint ID:</strong> {importData.jira.sprintId}
                </p>
              )}
              {importData.jira?.ticketKey && (
                <p>
                  <strong>Ticket Key:</strong> {importData.jira.ticketKey}
                </p>
              )}
              <p>
                <strong>GitHub:</strong> {importData.github?.owner}/{importData.github?.repo}
              </p>
            </div>
            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setStep(3)}>
                Back
              </Button>
              <Button onClick={handleImport}>Start Import</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
