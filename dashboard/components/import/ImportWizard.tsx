'use client';

import { FolderKanban, Tags, Ticket, Timer } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GitHubConfigForm } from './GitHubConfigForm';
import { ImportTypeCard } from './ImportTypeCard';
import { JiraImportForm } from './JiraImportForm';
import { StepIndicator } from './StepIndicator';

type ImportType = 'project' | 'sprint' | 'ticket' | 'feature';

interface ImportData {
  type: ImportType;
  jira: {
    projectKey: string;
    sprintId?: string;
    ticketKey?: string;
    label?: string;
  };
  github: {
    owner: string;
    repo: string;
  };
  useMock: boolean;
}

const WIZARD_STEPS = [
  { label: 'Import Type', shortLabel: 'Type' },
  { label: 'Jira Configuration', shortLabel: 'Jira' },
  { label: 'GitHub Configuration', shortLabel: 'GitHub' },
  { label: 'Review & Confirm', shortLabel: 'Review' },
];

const IMPORT_TYPES = [
  {
    type: 'project' as ImportType,
    icon: FolderKanban,
    title: 'Project',
    description:
      'Import all tickets from a Jira project. Best for analyzing complete project lifecycle.',
  },
  {
    type: 'sprint' as ImportType,
    icon: Timer,
    title: 'Sprint',
    description: 'Import tickets from a specific sprint. Ideal for sprint retrospectives.',
  },
  {
    type: 'ticket' as ImportType,
    icon: Ticket,
    title: 'Single Ticket',
    description:
      'Import a single Jira ticket and its complete history. For deep-diving into one issue.',
  },
  {
    type: 'feature' as ImportType,
    icon: Tags,
    title: 'Feature',
    description: 'Import tickets matching a Jira label. Perfect for tracking feature development.',
  },
];

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
      } else if (importData.type === 'feature') {
        jiraEndpoint = '/api/import/jira/feature';
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
      } else if (importData.type === 'feature' && importData.jira.label) {
        jiraBody.projectKey = importData.jira.projectKey;
        jiraBody.label = importData.jira.label;
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
      <CardHeader className="space-y-4">
        <CardTitle>Import Wizard</CardTitle>
        <StepIndicator steps={WIZARD_STEPS} currentStep={step} />
      </CardHeader>
      <CardContent>
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Select Import Type</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Choose how you want to import your development data
              </p>
            </div>
            <div className="grid gap-3">
              {IMPORT_TYPES.map((importType) => (
                <ImportTypeCard
                  key={importType.type}
                  icon={importType.icon}
                  title={importType.title}
                  description={importType.description}
                  onClick={() => handleTypeSelect(importType.type)}
                />
              ))}
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
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold">Review & Confirm</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Verify your import configuration before starting
              </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4">
              {/* Jira Config Card */}
              <div className="p-4 rounded-lg border border-border bg-muted/30">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-500/10 text-blue-600">
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
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
                  <span className="text-sm font-medium text-muted-foreground">Jira</span>
                </div>
                <div className="space-y-1.5">
                  <p className="text-sm">
                    <span className="text-muted-foreground">Type: </span>
                    <span className="font-medium capitalize">{importData.type}</span>
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Project: </span>
                    <span className="font-mono font-medium">{importData.jira?.projectKey}</span>
                  </p>
                  {importData.jira?.sprintId && (
                    <p className="text-sm">
                      <span className="text-muted-foreground">Sprint: </span>
                      <span className="font-mono font-medium">{importData.jira.sprintId}</span>
                    </p>
                  )}
                  {importData.jira?.ticketKey && (
                    <p className="text-sm">
                      <span className="text-muted-foreground">Ticket: </span>
                      <span className="font-mono font-medium">{importData.jira.ticketKey}</span>
                    </p>
                  )}
                  {importData.jira?.label && (
                    <p className="text-sm">
                      <span className="text-muted-foreground">Label: </span>
                      <span className="font-mono font-medium">{importData.jira.label}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* GitHub Config Card */}
              <div className="p-4 rounded-lg border border-border bg-muted/30">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-foreground/10 text-foreground">
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">GitHub</span>
                </div>
                <div className="space-y-1.5">
                  <p className="text-sm">
                    <span className="text-muted-foreground">Repository: </span>
                    <span className="font-mono font-medium">
                      {importData.github?.owner}/{importData.github?.repo}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* What will happen */}
            <div className="p-4 rounded-lg border border-border bg-muted/20">
              <h3 className="text-sm font-medium mb-2">What will happen:</h3>
              <ul className="text-sm text-muted-foreground space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  Fetch {importData.type === 'ticket' ? 'ticket history' : 'tickets'} from{' '}
                  {importData.jira?.projectKey}
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  Link commits and PRs from {importData.github?.owner}/{importData.github?.repo}
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  Calculate lifecycle metrics and phase distribution
                </li>
              </ul>
            </div>

            {error && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm font-semibold text-destructive mb-1">Error</p>
                <p className="text-sm text-destructive/90">{error}</p>
              </div>
            )}

            {importProgress && (
              <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                <p className="text-sm text-primary">{importProgress}</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setStep(3)} disabled={isImporting}>
                Back
              </Button>
              <Button onClick={handleImport} disabled={isImporting} className="flex-1">
                {isImporting ? 'Importing...' : 'Start Import'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
