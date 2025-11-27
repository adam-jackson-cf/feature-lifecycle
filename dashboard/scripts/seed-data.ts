/**
 * Seed data script for populating the database with realistic test data.
 *
 * Run with: bun run scripts/seed-data.ts
 *
 * Controlled by ENABLE_SEED_DATA environment variable.
 * Set ENABLE_SEED_DATA=true to run seed data generation.
 */

import { randomUUID } from 'crypto';
import { getDatabase } from '../lib/db';
import { EventType } from '../lib/types';

const ENABLE_SEED_DATA = process.env.ENABLE_SEED_DATA === 'true';

if (!ENABLE_SEED_DATA) {
  console.log('Seed data disabled. Set ENABLE_SEED_DATA=true to generate seed data.');
  process.exit(0);
}

interface SeedTicket {
  key: string;
  summary: string;
  issueType: string;
  status: string;
  statusCategory: 'To Do' | 'In Progress' | 'Done';
  discipline: string;
  labels: string[];
  complexity: 'XS' | 'S' | 'M' | 'L' | 'XL';
  storyPoints: number;
  assignee: string;
}

// Seed data representing realistic feature lifecycle distribution
// Target: Discovery 7%, Definition 11%, Design 11%, Development 32%, Testing 27%, Deployment 9%, Measure 3%
const SEED_TICKETS: SeedTicket[] = [
  // Discovery & Research (7% = ~2-3 tickets)
  {
    key: 'FEAT-001',
    summary: 'User research: interview 10 customers about payment friction',
    issueType: 'Research',
    status: 'Done',
    statusCategory: 'Done',
    discipline: 'unknown',
    labels: ['research', 'user-research', 'discovery'],
    complexity: 'M',
    storyPoints: 5,
    assignee: 'researcher1',
  },
  {
    key: 'FEAT-002',
    summary: 'Competitive analysis of checkout flows',
    issueType: 'Research',
    status: 'Done',
    statusCategory: 'Done',
    discipline: 'unknown',
    labels: ['research', 'spike'],
    complexity: 'S',
    storyPoints: 3,
    assignee: 'pm1',
  },

  // Definition & Planning (11% = ~4 tickets)
  {
    key: 'FEAT-003',
    summary: 'Write PRD for one-click checkout feature',
    issueType: 'Task',
    status: 'Done',
    statusCategory: 'Done',
    discipline: 'unknown',
    labels: ['prd', 'definition', 'planning'],
    complexity: 'M',
    storyPoints: 5,
    assignee: 'pm1',
  },
  {
    key: 'FEAT-004',
    summary: 'Technical spike: evaluate payment gateway options',
    issueType: 'Spike',
    status: 'Done',
    statusCategory: 'Done',
    discipline: 'backend',
    labels: ['spike', 'definition'],
    complexity: 'M',
    storyPoints: 5,
    assignee: 'dev1',
  },
  {
    key: 'FEAT-005',
    summary: 'Define acceptance criteria for checkout flow',
    issueType: 'Task',
    status: 'Done',
    statusCategory: 'Done',
    discipline: 'unknown',
    labels: ['requirements', 'refinement'],
    complexity: 'S',
    storyPoints: 2,
    assignee: 'pm1',
  },
  {
    key: 'FEAT-006',
    summary: 'Architecture review for payment processing',
    issueType: 'Task',
    status: 'Done',
    statusCategory: 'Done',
    discipline: 'backend',
    labels: ['planning', 'architecture'],
    complexity: 'M',
    storyPoints: 3,
    assignee: 'dev2',
  },

  // Design (11% = ~4 tickets)
  {
    key: 'FEAT-007',
    summary: 'Design checkout UI wireframes',
    issueType: 'Design',
    status: 'Done',
    statusCategory: 'Done',
    discipline: 'unknown',
    labels: ['design', 'wireframe', 'ux'],
    complexity: 'M',
    storyPoints: 5,
    assignee: 'designer1',
  },
  {
    key: 'FEAT-008',
    summary: 'Create high-fidelity mockups for payment form',
    issueType: 'Design',
    status: 'Done',
    statusCategory: 'Done',
    discipline: 'unknown',
    labels: ['design', 'ui-design'],
    complexity: 'M',
    storyPoints: 5,
    assignee: 'designer1',
  },
  {
    key: 'FEAT-009',
    summary: 'Design error states and validation feedback',
    issueType: 'Design',
    status: 'Done',
    statusCategory: 'Done',
    discipline: 'unknown',
    labels: ['design', 'ux'],
    complexity: 'S',
    storyPoints: 3,
    assignee: 'designer1',
  },
  {
    key: 'FEAT-010',
    summary: 'Prototype interactive checkout flow',
    issueType: 'Design',
    status: 'Done',
    statusCategory: 'Done',
    discipline: 'unknown',
    labels: ['prototype', 'design'],
    complexity: 'M',
    storyPoints: 5,
    assignee: 'designer2',
  },

  // Development (32% = ~12 tickets)
  {
    key: 'FEAT-011',
    summary: 'Implement payment API integration',
    issueType: 'Story',
    status: 'Done',
    statusCategory: 'Done',
    discipline: 'backend',
    labels: ['backend', 'api'],
    complexity: 'L',
    storyPoints: 8,
    assignee: 'dev1',
  },
  {
    key: 'FEAT-012',
    summary: 'Build checkout form component',
    issueType: 'Story',
    status: 'Done',
    statusCategory: 'Done',
    discipline: 'frontend',
    labels: ['frontend', 'ui'],
    complexity: 'M',
    storyPoints: 5,
    assignee: 'dev3',
  },
  {
    key: 'FEAT-013',
    summary: 'Add form validation logic',
    issueType: 'Story',
    status: 'Done',
    statusCategory: 'Done',
    discipline: 'frontend',
    labels: ['frontend', 'validation'],
    complexity: 'M',
    storyPoints: 5,
    assignee: 'dev3',
  },
  {
    key: 'FEAT-014',
    summary: 'Implement order confirmation page',
    issueType: 'Story',
    status: 'Done',
    statusCategory: 'Done',
    discipline: 'frontend',
    labels: ['frontend', 'ui'],
    complexity: 'M',
    storyPoints: 5,
    assignee: 'dev4',
  },
  {
    key: 'FEAT-015',
    summary: 'Build payment processing webhook handler',
    issueType: 'Story',
    status: 'Done',
    statusCategory: 'Done',
    discipline: 'backend',
    labels: ['backend', 'webhooks'],
    complexity: 'L',
    storyPoints: 8,
    assignee: 'dev1',
  },
  {
    key: 'FEAT-016',
    summary: 'Add payment retry logic',
    issueType: 'Story',
    status: 'Done',
    statusCategory: 'Done',
    discipline: 'backend',
    labels: ['backend', 'reliability'],
    complexity: 'M',
    storyPoints: 5,
    assignee: 'dev2',
  },
  {
    key: 'FEAT-017',
    summary: 'Implement saved payment methods',
    issueType: 'Story',
    status: 'Done',
    statusCategory: 'Done',
    discipline: 'backend',
    labels: ['backend', 'feature'],
    complexity: 'L',
    storyPoints: 8,
    assignee: 'dev1',
  },
  {
    key: 'FEAT-018',
    summary: 'Build payment method selector UI',
    issueType: 'Story',
    status: 'Done',
    statusCategory: 'Done',
    discipline: 'frontend',
    labels: ['frontend', 'ui'],
    complexity: 'M',
    storyPoints: 5,
    assignee: 'dev3',
  },
  {
    key: 'FEAT-019',
    summary: 'Add loading states and error handling',
    issueType: 'Story',
    status: 'Done',
    statusCategory: 'Done',
    discipline: 'frontend',
    labels: ['frontend', 'ux'],
    complexity: 'S',
    storyPoints: 3,
    assignee: 'dev4',
  },
  {
    key: 'FEAT-020',
    summary: 'Integrate with analytics tracking',
    issueType: 'Story',
    status: 'Done',
    statusCategory: 'Done',
    discipline: 'frontend',
    labels: ['frontend', 'analytics'],
    complexity: 'S',
    storyPoints: 3,
    assignee: 'dev4',
  },
  {
    key: 'FEAT-021',
    summary: 'Add mobile responsive styles',
    issueType: 'Story',
    status: 'Done',
    statusCategory: 'Done',
    discipline: 'frontend',
    labels: ['frontend', 'mobile'],
    complexity: 'M',
    storyPoints: 5,
    assignee: 'dev3',
  },
  {
    key: 'FEAT-022',
    summary: 'Implement email receipts',
    issueType: 'Story',
    status: 'Done',
    statusCategory: 'Done',
    discipline: 'backend',
    labels: ['backend', 'email'],
    complexity: 'M',
    storyPoints: 5,
    assignee: 'dev2',
  },

  // Testing & QA (27% = ~10 tickets)
  {
    key: 'FEAT-023',
    summary: 'Write unit tests for payment API',
    issueType: 'Task',
    status: 'Done',
    statusCategory: 'Done',
    discipline: 'qa',
    labels: ['testing', 'unit-test'],
    complexity: 'M',
    storyPoints: 5,
    assignee: 'qa1',
  },
  {
    key: 'FEAT-024',
    summary: 'Create integration tests for checkout flow',
    issueType: 'Task',
    status: 'Done',
    statusCategory: 'Done',
    discipline: 'qa',
    labels: ['testing', 'integration'],
    complexity: 'L',
    storyPoints: 8,
    assignee: 'qa1',
  },
  {
    key: 'FEAT-025',
    summary: 'E2E tests for happy path checkout',
    issueType: 'Task',
    status: 'Done',
    statusCategory: 'Done',
    discipline: 'qa',
    labels: ['testing', 'e2e', 'quality'],
    complexity: 'L',
    storyPoints: 8,
    assignee: 'qa2',
  },
  {
    key: 'FEAT-026',
    summary: 'Test payment failure scenarios',
    issueType: 'Task',
    status: 'Done',
    statusCategory: 'Done',
    discipline: 'qa',
    labels: ['testing', 'edge-cases'],
    complexity: 'M',
    storyPoints: 5,
    assignee: 'qa1',
  },
  {
    key: 'FEAT-027',
    summary: 'Cross-browser testing',
    issueType: 'Task',
    status: 'Done',
    statusCategory: 'Done',
    discipline: 'qa',
    labels: ['testing', 'browser'],
    complexity: 'M',
    storyPoints: 5,
    assignee: 'qa2',
  },
  {
    key: 'FEAT-028',
    summary: 'Mobile device testing',
    issueType: 'Task',
    status: 'Done',
    statusCategory: 'Done',
    discipline: 'qa',
    labels: ['testing', 'mobile', 'qa'],
    complexity: 'M',
    storyPoints: 5,
    assignee: 'qa2',
  },
  {
    key: 'FEAT-029',
    summary: 'Load testing payment endpoint',
    issueType: 'Task',
    status: 'Done',
    statusCategory: 'Done',
    discipline: 'qa',
    labels: ['testing', 'performance'],
    complexity: 'M',
    storyPoints: 5,
    assignee: 'qa1',
  },
  {
    key: 'FEAT-030',
    summary: 'Security testing for payment data',
    issueType: 'Task',
    status: 'Done',
    statusCategory: 'Done',
    discipline: 'qa',
    labels: ['testing', 'security'],
    complexity: 'L',
    storyPoints: 8,
    assignee: 'qa1',
  },
  {
    key: 'FEAT-031',
    summary: 'Regression testing existing checkout',
    issueType: 'Task',
    status: 'Done',
    statusCategory: 'Done',
    discipline: 'qa',
    labels: ['testing', 'regression'],
    complexity: 'M',
    storyPoints: 5,
    assignee: 'qa2',
  },
  {
    key: 'FEAT-032',
    summary: 'UAT with stakeholders',
    issueType: 'Task',
    status: 'Done',
    statusCategory: 'Done',
    discipline: 'qa',
    labels: ['testing', 'uat'],
    complexity: 'M',
    storyPoints: 5,
    assignee: 'pm1',
  },

  // Deployment (9% = ~3 tickets)
  {
    key: 'FEAT-033',
    summary: 'Configure staging environment',
    issueType: 'Task',
    status: 'Done',
    statusCategory: 'Done',
    discipline: 'devops',
    labels: ['deployment', 'infra', 'ci-cd'],
    complexity: 'M',
    storyPoints: 5,
    assignee: 'devops1',
  },
  {
    key: 'FEAT-034',
    summary: 'Set up feature flags for rollout',
    issueType: 'Task',
    status: 'Done',
    statusCategory: 'Done',
    discipline: 'devops',
    labels: ['deployment', 'feature-flag', 'release'],
    complexity: 'S',
    storyPoints: 3,
    assignee: 'devops1',
  },
  {
    key: 'FEAT-035',
    summary: 'Production deployment and monitoring setup',
    issueType: 'Task',
    status: 'Done',
    statusCategory: 'Done',
    discipline: 'devops',
    labels: ['deployment', 'production', 'deploy'],
    complexity: 'M',
    storyPoints: 5,
    assignee: 'devops1',
  },

  // Measure (3% = ~1 ticket)
  {
    key: 'FEAT-036',
    summary: 'Set up conversion funnel tracking',
    issueType: 'Task',
    status: 'Done',
    statusCategory: 'Done',
    discipline: 'data',
    labels: ['measure', 'analytics', 'metrics'],
    complexity: 'M',
    storyPoints: 5,
    assignee: 'analyst1',
  },
];

const db = getDatabase();

function seedCaseStudy(): string {
  const id = randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO case_studies (id, name, jira_project_key, github_owner, github_repo, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, 'One-Click Checkout Feature', 'FEAT', 'acme-corp', 'checkout-app', now, now);

  console.log(`Created case study: ${id}`);
  return id;
}

function seedTicket(caseStudyId: string, ticket: SeedTicket): string {
  const id = randomUUID();
  const now = new Date();
  const createdAt = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000); // Random date in last 30 days
  const resolvedAt =
    ticket.statusCategory === 'Done'
      ? new Date(createdAt.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000)
      : null;

  const rawJiraData = {
    id: ticket.key,
    key: ticket.key,
    fields: {
      summary: ticket.summary,
      issuetype: { name: ticket.issueType },
      status: {
        name: ticket.status,
        statusCategory: { key: ticket.statusCategory.toLowerCase().replace(' ', '') },
      },
      priority: { name: 'Medium' },
      labels: ticket.labels,
      assignee: { displayName: ticket.assignee, accountId: ticket.assignee },
      reporter: { displayName: 'pm1', accountId: 'pm1' },
      created: createdAt.toISOString(),
      updated: now.toISOString(),
      resolutiondate: resolvedAt?.toISOString() || null,
    },
  };

  db.prepare(`
    INSERT INTO jira_tickets (
      id, case_study_id, jira_id, jira_key, summary, description, issue_type, priority,
      current_status, status_category, assignee_id, assignee_name, reporter_id, reporter_name,
      story_points, created_at, updated_at, resolved_at, complexity_size, discipline,
      raw_jira_data
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    caseStudyId,
    ticket.key,
    ticket.key,
    ticket.summary,
    null,
    ticket.issueType,
    'Medium',
    ticket.status,
    ticket.statusCategory,
    ticket.assignee,
    ticket.assignee,
    'pm1',
    'pm1',
    ticket.storyPoints,
    createdAt.toISOString(),
    now.toISOString(),
    resolvedAt?.toISOString() || null,
    ticket.complexity,
    ticket.discipline,
    JSON.stringify(rawJiraData)
  );

  return id;
}

function seedEvents(caseStudyId: string, ticketKey: string, ticket: SeedTicket): void {
  const now = new Date();
  const createdAt = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000);

  // Ticket created event
  const createEventId = randomUUID();
  db.prepare(`
    INSERT INTO lifecycle_events (
      id, case_study_id, ticket_key, event_type, event_source, event_date,
      actor_name, actor_id, details, discipline, complexity_size, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    createEventId,
    caseStudyId,
    ticketKey,
    EventType.TICKET_CREATED,
    'jira',
    createdAt.toISOString(),
    'pm1',
    'pm1',
    JSON.stringify({ summary: ticket.summary }),
    ticket.discipline,
    ticket.complexity,
    now.toISOString()
  );

  // Status change events
  const statuses = ['To Do', 'In Progress', 'In Review', 'Done'];
  let eventDate = new Date(createdAt.getTime() + 1000 * 60 * 60); // 1 hour after creation

  for (let i = 1; i < statuses.length; i++) {
    if (statuses[i] === 'Done' && ticket.statusCategory !== 'Done') break;

    const eventId = randomUUID();
    db.prepare(`
      INSERT INTO lifecycle_events (
        id, case_study_id, ticket_key, event_type, event_source, event_date,
        actor_name, actor_id, details, discipline, complexity_size, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      eventId,
      caseStudyId,
      ticketKey,
      EventType.STATUS_CHANGED,
      'jira',
      eventDate.toISOString(),
      ticket.assignee,
      ticket.assignee,
      JSON.stringify({ fromStatus: statuses[i - 1], toStatus: statuses[i] }),
      ticket.discipline,
      ticket.complexity,
      now.toISOString()
    );

    eventDate = new Date(eventDate.getTime() + Math.random() * 24 * 60 * 60 * 1000);
  }

  // Normalized events
  const normalizedEventId = randomUUID();
  db.prepare(`
    INSERT INTO normalized_events (
      id, case_study_id, ticket_key, event_type, event_source, occurred_at,
      actor_name, actor_id, discipline, complexity_size, details, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    normalizedEventId,
    caseStudyId,
    ticketKey,
    EventType.TICKET_CREATED,
    'jira',
    createdAt.toISOString(),
    'pm1',
    'pm1',
    ticket.discipline,
    ticket.complexity,
    JSON.stringify({ summary: ticket.summary }),
    now.toISOString()
  );
}

function main() {
  console.log('Starting seed data generation...');

  try {
    // Check if case study already exists
    const existing = db
      .prepare('SELECT COUNT(*) as count FROM case_studies WHERE name = ?')
      .get('One-Click Checkout Feature') as { count: number };
    if (existing.count > 0) {
      console.log('Seed data already exists. Skipping.');
      return;
    }

    const caseStudyId = seedCaseStudy();

    for (const ticket of SEED_TICKETS) {
      seedTicket(caseStudyId, ticket);
      seedEvents(caseStudyId, ticket.key, ticket);
    }

    console.log(`Seeded ${SEED_TICKETS.length} tickets with lifecycle events.`);
    console.log('Seed data generation complete!');
  } catch (error) {
    console.error('Error generating seed data:', error);
    process.exit(1);
  }
}

main();
