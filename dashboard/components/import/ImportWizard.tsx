'use client';

import { useRouter } from 'next/navigation';
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
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [importData, setImportData] = useState<Partial<ImportData>>({});
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importProgress, setImportProgress] = useState<string>('');

  const handleTypeSelect = (type: ImportType) => {
    setImportData((prev) => ({ ...prev, type }));
    setStep(2);
  };

  const handleJiraSubmit = (jiraData: ImportData['jira']) => {
    setImportData((prev) => ({ ...prev, jira: jiraData }));
    setStep(3);
  };

  const handleGitHubSubmit = (githubData: ImportData['github']) => {
    setImportData((prev) => ({ ...prev, github: githubData }));
    setStep(4);
  };

  const handleImport = async () => {
    console.log('Import data:', JSON.stringify(importData, null, 2));
    if (!importData.type || !importData.jira || !importData.github) {
      setError('Missing required import data');
      console.error('Missing data:', {
        type: importData.type,
        jira: importData.jira,
        github: importData.github,
      });
      return;
    }

    if (!importData.jira.projectKey || !importData.github.owner || !importData.github.repo) {
      setError('Missing required fields in import data');
      console.error('Missing fields:', {
        projectKey: importData.jira.projectKey,
        owner: importData.github.owner,
        repo: importData.github.repo,
      });
      return;
    }

    setIsImporting(true);
    setError(null);
    setImportProgress('Creating case study...');

    try {
      // Step 1: Create case study
      const requestBody = {
        name: `${importData.jira.projectKey} - ${importData.type} import`,
        type: importData.type,
        jiraProjectKey: importData.jira.projectKey,
        ...(importData.jira.sprintId && { jiraSprintId: importData.jira.sprintId }),
        ...(importData.jira.ticketKey && { jiraTicketKey: importData.jira.ticketKey }),
        githubOwner: importData.github.owner,
        githubRepo: importData.github.repo,
      };

      console.log('Request body:', JSON.stringify(requestBody, null, 2));

      const caseStudyResponse = await fetch('/api/case-studies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!caseStudyResponse.ok) {
        type CaseStudyError = { error?: string; details?: { path: string[]; message: string }[] };
        let errorData: CaseStudyError = {};
        try {
          errorData = (await caseStudyResponse.json()) as CaseStudyError;
        } catch {
          errorData = {
            error: `HTTP ${caseStudyResponse.status}: ${caseStudyResponse.statusText}`,
          };
        }
        console.error('Case study creation failed:', errorData);
        const detailMessage = Array.isArray(errorData.details)
          ? errorData.details.map((d) => `${d.path.join('.')}: ${d.message}`).join(', ')
          : null;
        const errorMessage =
          detailMessage && detailMessage.length > 0
            ? `Validation error: ${detailMessage}`
            : errorData.error || 'Failed to create case study';
        throw new Error(errorMessage);
      }

      const caseStudy = await caseStudyResponse.json();
      setImportProgress(`Case study created. Importing Jira data...`);

      // Step 2: Import Jira data
      let jiraEndpoint = '/api/import/jira/project';
      if (importData.type === 'sprint') {
        jiraEndpoint = '/api/import/jira/sprint';
      } else if (importData.type === 'ticket') {
        jiraEndpoint = '/api/import/jira/ticket';
      }

      const jiraBody: Record<string, unknown> = {
        caseStudyId: caseStudy.id,
      };

      if (importData.type === 'project') {
        jiraBody.projectKey = importData.jira.projectKey;
      } else if (importData.type === 'sprint') {
        // For sprint, we need to fetch issues first (simplified - would need actual sprint fetch)
        jiraBody.issues = [];
        jiraBody.sprintId = importData.jira.sprintId;
      } else if (importData.type === 'ticket' && importData.jira.ticketKey) {
        // Fetch single ticket
        try {
          const ticketResponse = await fetch(
            `https://issues.apache.org/jira/rest/api/2/issue/${importData.jira.ticketKey}`
          );
          if (ticketResponse.ok) {
            const ticketData = await ticketResponse.json();
            jiraBody.issue = ticketData;
          }
        } catch (err) {
          console.warn('Could not fetch ticket, will try with project key:', err);
          jiraBody.projectKey = importData.jira.projectKey;
        }
      }

      const jiraResponse = await fetch(jiraEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jiraBody),
      });

      if (!jiraResponse.ok) {
        const errorData = await jiraResponse.json();
        throw new Error(errorData.error || 'Failed to import Jira data');
      }

      const jiraResult = await jiraResponse.json();
      setImportProgress(
        `Imported ${jiraResult.imported || 0} Jira tickets. Importing GitHub data...`
      );

      // Step 3: Import GitHub data
      const githubResponse = await fetch('/api/import/github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseStudyId: caseStudy.id,
          perPage: 30,
          maxCommits: 100,
        }),
      });

      if (!githubResponse.ok) {
        const errorData = await githubResponse.json();
        throw new Error(errorData.error || 'Failed to import GitHub data');
      }

      const githubResult = await githubResponse.json();
      setImportProgress(
        `Import complete! Imported ${jiraResult.imported || 0} tickets and ${githubResult.eventsImported || 0} events.`
      );

      // Redirect to case study dashboard
      setTimeout(() => {
        router.push(`/case-studies/${caseStudy.id}`);
      }, 1500);
    } catch (err) {
      console.error('Import error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Import failed';
      setError(errorMessage);
      setIsImporting(false);
      setImportProgress('');
    }
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
                  <div className="text-sm text-muted-foreground">
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
                  <div className="text-sm text-muted-foreground">
                    Import tickets from a specific sprint
                  </div>
                </div>
              </Button>
              <Button
                variant="outline"
                onClick={() => handleTypeSelect('ticket')}
                className="h-auto p-4 text-left"
              >
                <div>
                  <div className="font-semibold">Single Ticket</div>
                  <div className="text-sm text-muted-foreground">Import a single Jira ticket</div>
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

            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <p className="text-sm font-semibold text-red-800 dark:text-red-200 mb-1">Error:</p>
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            {importProgress && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                <p className="text-sm text-blue-800 dark:text-blue-200">{importProgress}</p>
              </div>
            )}

            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setStep(3)} disabled={isImporting}>
                Back
              </Button>
              <Button onClick={handleImport} disabled={isImporting}>
                {isImporting ? 'Importing...' : 'Start Import'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
