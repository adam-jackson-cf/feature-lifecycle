/**
 * Comprehensive seed data script for populating the database with realistic test data.
 *
 * Run with: ENABLE_SEED_DATA=true bun run scripts/seed-data.ts
 *
 * This generates:
 * - 50+ tickets across multiple disciplines
 * - 4 sprints with velocity data
 * - Full lifecycle events (Jira + GitHub)
 * - Varied status distribution (To Do, In Progress, Done)
 * - Realistic lead/cycle times
 * - Multiple complexity sizes (XS through XL)
 */

import { randomUUID } from 'node:crypto';
import { getDatabase } from '../lib/db';
import { EventType } from '../lib/types';

const ENABLE_SEED_DATA = process.env.ENABLE_SEED_DATA === 'true';

if (!ENABLE_SEED_DATA) {
  console.log('Seed data disabled. Set ENABLE_SEED_DATA=true to generate seed data.');
  process.exit(0);
}

// Configuration
const CASE_STUDY_NAME = 'E-Commerce Platform Rebuild';
const JIRA_PROJECT = 'ECOM';
const GITHUB_OWNER = 'acme-corp';
const GITHUB_REPO = 'ecommerce-platform';

// Sprint definitions (4 sprints over ~8 weeks)
const SPRINTS = [
  { id: 'sprint-1', name: 'Sprint 1 - Foundation', startDate: -56, endDate: -42 },
  { id: 'sprint-2', name: 'Sprint 2 - Core Features', startDate: -42, endDate: -28 },
  { id: 'sprint-3', name: 'Sprint 3 - Integration', startDate: -28, endDate: -14 },
  { id: 'sprint-4', name: 'Sprint 4 - Polish', startDate: -14, endDate: 0 },
];

// Team members
const TEAM = {
  backend: ['alice.smith', 'bob.jones', 'charlie.lee'],
  frontend: ['diana.chen', 'evan.taylor', 'fiona.wang'],
  mobile: ['george.kim', 'hannah.patel'],
  devops: ['ivan.novak', 'julia.santos'],
  qa: ['kevin.murphy', 'lisa.anderson'],
  data: ['mike.brown'],
  pm: ['nancy.wilson', 'oliver.davis'],
  design: ['patricia.garcia', 'quinn.martinez'],
};

type StatusCategory = 'To Do' | 'In Progress' | 'Done';
type ComplexitySize = 'XS' | 'S' | 'M' | 'L' | 'XL';
type Discipline = 'backend' | 'frontend' | 'mobile' | 'devops' | 'qa' | 'data' | 'unknown';

interface SeedTicket {
  key: string;
  summary: string;
  description: string;
  issueType: string;
  status: string;
  statusCategory: StatusCategory;
  discipline: Discipline;
  labels: string[];
  complexity: ComplexitySize;
  storyPoints: number;
  assignee: string;
  sprintId: string;
  sprintName: string;
  daysAgoCreated: number;
  daysToComplete: number | null; // null = not completed
  aiFlag: boolean;
}

// Generate comprehensive ticket data
function generateTickets(): SeedTicket[] {
  const tickets: SeedTicket[] = [];
  let ticketNum = 1;

  const addTicket = (t: Omit<SeedTicket, 'key'>) => {
    tickets.push({ ...t, key: `${JIRA_PROJECT}-${String(ticketNum++).padStart(4, '0')}` });
  };

  // Sprint 1: Foundation (Discovery, Definition, Architecture)
  // Discovery tickets
  addTicket({
    summary: 'User research: interview 15 customers about checkout pain points',
    description:
      'Conduct user interviews to understand current checkout friction. Document findings in Confluence. Include personas and journey maps.',
    issueType: 'Research',
    status: 'Done',
    statusCategory: 'Done',
    discipline: 'unknown',
    labels: ['research', 'user-research', 'discovery'],
    complexity: 'M',
    storyPoints: 5,
    assignee: TEAM.pm[0],
    sprintId: SPRINTS[0].id,
    sprintName: SPRINTS[0].name,
    daysAgoCreated: 55,
    daysToComplete: 5,
    aiFlag: false,
  });

  addTicket({
    summary: 'Competitive analysis: analyze top 5 competitor checkout flows',
    description:
      'Document checkout flows from Amazon, Shopify, Stripe, PayPal, and Square. Identify best practices and opportunities.',
    issueType: 'Research',
    status: 'Done',
    statusCategory: 'Done',
    discipline: 'unknown',
    labels: ['research', 'competitive-analysis'],
    complexity: 'S',
    storyPoints: 3,
    assignee: TEAM.pm[1],
    sprintId: SPRINTS[0].id,
    sprintName: SPRINTS[0].name,
    daysAgoCreated: 54,
    daysToComplete: 3,
    aiFlag: false,
  });

  addTicket({
    summary: 'Technical spike: evaluate payment gateway options (Stripe, Adyen, Braintree)',
    description:
      'Compare payment gateways on: fees, supported methods, PCI compliance, SDK quality, webhook reliability. Recommend top choice.',
    issueType: 'Spike',
    status: 'Done',
    statusCategory: 'Done',
    discipline: 'backend',
    labels: ['spike', 'payments', 'evaluation'],
    complexity: 'M',
    storyPoints: 5,
    assignee: TEAM.backend[0],
    sprintId: SPRINTS[0].id,
    sprintName: SPRINTS[0].name,
    daysAgoCreated: 53,
    daysToComplete: 4,
    aiFlag: true,
  });

  // Definition tickets
  addTicket({
    summary: 'Write PRD for one-click checkout feature',
    description:
      'Product requirements document covering: user stories, acceptance criteria, success metrics, rollout plan, and dependencies.',
    issueType: 'Task',
    status: 'Done',
    statusCategory: 'Done',
    discipline: 'unknown',
    labels: ['prd', 'definition', 'documentation'],
    complexity: 'M',
    storyPoints: 5,
    assignee: TEAM.pm[0],
    sprintId: SPRINTS[0].id,
    sprintName: SPRINTS[0].name,
    daysAgoCreated: 50,
    daysToComplete: 4,
    aiFlag: false,
  });

  addTicket({
    summary: 'Define API contract for payment processing',
    description:
      'OpenAPI specification for payment endpoints. Include request/response schemas, error codes, and rate limits.',
    issueType: 'Task',
    status: 'Done',
    statusCategory: 'Done',
    discipline: 'backend',
    labels: ['api', 'definition', 'contract'],
    complexity: 'M',
    storyPoints: 5,
    assignee: TEAM.backend[1],
    sprintId: SPRINTS[0].id,
    sprintName: SPRINTS[0].name,
    daysAgoCreated: 48,
    daysToComplete: 3,
    aiFlag: true,
  });

  addTicket({
    summary: 'Architecture review: design payment microservice',
    description:
      'Design scalable payment service architecture. Cover: database schema, caching strategy, failover handling, and monitoring.',
    issueType: 'Task',
    status: 'Done',
    statusCategory: 'Done',
    discipline: 'backend',
    labels: ['architecture', 'design', 'microservice'],
    complexity: 'L',
    storyPoints: 8,
    assignee: TEAM.backend[0],
    sprintId: SPRINTS[0].id,
    sprintName: SPRINTS[0].name,
    daysAgoCreated: 47,
    daysToComplete: 5,
    aiFlag: false,
  });

  // Design tickets
  addTicket({
    summary: 'Design checkout UI wireframes',
    description:
      'Low-fidelity wireframes for: cart summary, shipping form, payment form, order confirmation. Mobile-first approach.',
    issueType: 'Design',
    status: 'Done',
    statusCategory: 'Done',
    discipline: 'unknown',
    labels: ['design', 'wireframe', 'ux'],
    complexity: 'M',
    storyPoints: 5,
    assignee: TEAM.design[0],
    sprintId: SPRINTS[0].id,
    sprintName: SPRINTS[0].name,
    daysAgoCreated: 45,
    daysToComplete: 4,
    aiFlag: false,
  });

  addTicket({
    summary: 'Create high-fidelity mockups for payment form',
    description:
      'Pixel-perfect designs in Figma. Include: light/dark mode, error states, loading states, and micro-interactions.',
    issueType: 'Design',
    status: 'Done',
    statusCategory: 'Done',
    discipline: 'unknown',
    labels: ['design', 'ui', 'figma'],
    complexity: 'M',
    storyPoints: 5,
    assignee: TEAM.design[0],
    sprintId: SPRINTS[0].id,
    sprintName: SPRINTS[0].name,
    daysAgoCreated: 43,
    daysToComplete: 3,
    aiFlag: false,
  });

  // Sprint 2: Core Features (Development)
  // Backend development
  addTicket({
    summary: 'Implement Stripe payment integration',
    description:
      'Integrate Stripe SDK. Support: card payments, Apple Pay, Google Pay. Handle webhooks for payment status updates.',
    issueType: 'Story',
    status: 'Done',
    statusCategory: 'Done',
    discipline: 'backend',
    labels: ['backend', 'payments', 'stripe'],
    complexity: 'XL',
    storyPoints: 13,
    assignee: TEAM.backend[0],
    sprintId: SPRINTS[1].id,
    sprintName: SPRINTS[1].name,
    daysAgoCreated: 40,
    daysToComplete: 8,
    aiFlag: true,
  });

  addTicket({
    summary: 'Build order processing service',
    description:
      'Create order service: validate cart, calculate totals, apply discounts, create order record, trigger payment.',
    issueType: 'Story',
    status: 'Done',
    statusCategory: 'Done',
    discipline: 'backend',
    labels: ['backend', 'orders', 'service'],
    complexity: 'L',
    storyPoints: 8,
    assignee: TEAM.backend[1],
    sprintId: SPRINTS[1].id,
    sprintName: SPRINTS[1].name,
    daysAgoCreated: 39,
    daysToComplete: 6,
    aiFlag: false,
  });

  addTicket({
    summary: 'Implement payment webhook handler',
    description:
      'Handle Stripe webhooks: payment_intent.succeeded, payment_intent.failed, charge.refunded. Update order status accordingly.',
    issueType: 'Story',
    status: 'Done',
    statusCategory: 'Done',
    discipline: 'backend',
    labels: ['backend', 'webhooks', 'payments'],
    complexity: 'M',
    storyPoints: 5,
    assignee: TEAM.backend[2],
    sprintId: SPRINTS[1].id,
    sprintName: SPRINTS[1].name,
    daysAgoCreated: 38,
    daysToComplete: 4,
    aiFlag: true,
  });

  addTicket({
    summary: 'Add payment retry and idempotency logic',
    description:
      'Implement retry mechanism for failed payments. Use idempotency keys to prevent duplicate charges.',
    issueType: 'Story',
    status: 'Done',
    statusCategory: 'Done',
    discipline: 'backend',
    labels: ['backend', 'reliability', 'payments'],
    complexity: 'M',
    storyPoints: 5,
    assignee: TEAM.backend[0],
    sprintId: SPRINTS[1].id,
    sprintName: SPRINTS[1].name,
    daysAgoCreated: 35,
    daysToComplete: 3,
    aiFlag: false,
  });

  addTicket({
    summary: 'Implement saved payment methods API',
    description:
      'CRUD endpoints for saved cards. Tokenize card data with Stripe. Support default payment method selection.',
    issueType: 'Story',
    status: 'Done',
    statusCategory: 'Done',
    discipline: 'backend',
    labels: ['backend', 'api', 'payments'],
    complexity: 'L',
    storyPoints: 8,
    assignee: TEAM.backend[1],
    sprintId: SPRINTS[1].id,
    sprintName: SPRINTS[1].name,
    daysAgoCreated: 34,
    daysToComplete: 5,
    aiFlag: true,
  });

  // Frontend development
  addTicket({
    summary: 'Build checkout page shell and routing',
    description:
      'Set up checkout route with step navigation: cart → shipping → payment → confirmation. Preserve state across steps.',
    issueType: 'Story',
    status: 'Done',
    statusCategory: 'Done',
    discipline: 'frontend',
    labels: ['frontend', 'checkout', 'routing'],
    complexity: 'M',
    storyPoints: 5,
    assignee: TEAM.frontend[0],
    sprintId: SPRINTS[1].id,
    sprintName: SPRINTS[1].name,
    daysAgoCreated: 40,
    daysToComplete: 4,
    aiFlag: false,
  });

  addTicket({
    summary: 'Implement cart summary component',
    description:
      'Display cart items with: product image, name, quantity selector, price, remove button. Show subtotal and estimated tax.',
    issueType: 'Story',
    status: 'Done',
    statusCategory: 'Done',
    discipline: 'frontend',
    labels: ['frontend', 'cart', 'ui'],
    complexity: 'M',
    storyPoints: 5,
    assignee: TEAM.frontend[1],
    sprintId: SPRINTS[1].id,
    sprintName: SPRINTS[1].name,
    daysAgoCreated: 39,
    daysToComplete: 3,
    aiFlag: false,
  });

  addTicket({
    summary: 'Build shipping address form',
    description:
      'Address form with: name, street, city, state, zip, country. Include address autocomplete using Google Places API.',
    issueType: 'Story',
    status: 'Done',
    statusCategory: 'Done',
    discipline: 'frontend',
    labels: ['frontend', 'forms', 'shipping'],
    complexity: 'M',
    storyPoints: 5,
    assignee: TEAM.frontend[2],
    sprintId: SPRINTS[1].id,
    sprintName: SPRINTS[1].name,
    daysAgoCreated: 37,
    daysToComplete: 4,
    aiFlag: true,
  });

  addTicket({
    summary: 'Implement payment form with Stripe Elements',
    description:
      'Integrate Stripe Elements for secure card input. Support: card number, expiry, CVC. Handle validation errors.',
    issueType: 'Story',
    status: 'Done',
    statusCategory: 'Done',
    discipline: 'frontend',
    labels: ['frontend', 'payments', 'stripe'],
    complexity: 'L',
    storyPoints: 8,
    assignee: TEAM.frontend[0],
    sprintId: SPRINTS[1].id,
    sprintName: SPRINTS[1].name,
    daysAgoCreated: 35,
    daysToComplete: 5,
    aiFlag: true,
  });

  addTicket({
    summary: 'Build order confirmation page',
    description:
      'Display: order number, items ordered, shipping address, payment method (masked), estimated delivery, and receipt link.',
    issueType: 'Story',
    status: 'Done',
    statusCategory: 'Done',
    discipline: 'frontend',
    labels: ['frontend', 'ui', 'confirmation'],
    complexity: 'S',
    storyPoints: 3,
    assignee: TEAM.frontend[1],
    sprintId: SPRINTS[1].id,
    sprintName: SPRINTS[1].name,
    daysAgoCreated: 32,
    daysToComplete: 2,
    aiFlag: false,
  });

  // Mobile development
  addTicket({
    summary: 'Implement native checkout flow for iOS',
    description:
      'Swift implementation of checkout flow. Support Apple Pay integration and biometric authentication for saved cards.',
    issueType: 'Story',
    status: 'Done',
    statusCategory: 'Done',
    discipline: 'mobile',
    labels: ['mobile', 'ios', 'checkout'],
    complexity: 'XL',
    storyPoints: 13,
    assignee: TEAM.mobile[0],
    sprintId: SPRINTS[1].id,
    sprintName: SPRINTS[1].name,
    daysAgoCreated: 40,
    daysToComplete: 10,
    aiFlag: false,
  });

  addTicket({
    summary: 'Implement native checkout flow for Android',
    description:
      'Kotlin implementation of checkout flow. Support Google Pay integration and fingerprint authentication.',
    issueType: 'Story',
    status: 'Done',
    statusCategory: 'Done',
    discipline: 'mobile',
    labels: ['mobile', 'android', 'checkout'],
    complexity: 'XL',
    storyPoints: 13,
    assignee: TEAM.mobile[1],
    sprintId: SPRINTS[1].id,
    sprintName: SPRINTS[1].name,
    daysAgoCreated: 40,
    daysToComplete: 10,
    aiFlag: false,
  });

  // Sprint 3: Integration & Testing
  addTicket({
    summary: 'Add form validation with Zod schemas',
    description:
      'Implement client-side validation for all checkout forms. Show inline error messages. Prevent form submission on invalid data.',
    issueType: 'Story',
    status: 'Done',
    statusCategory: 'Done',
    discipline: 'frontend',
    labels: ['frontend', 'validation', 'forms'],
    complexity: 'M',
    storyPoints: 5,
    assignee: TEAM.frontend[2],
    sprintId: SPRINTS[2].id,
    sprintName: SPRINTS[2].name,
    daysAgoCreated: 27,
    daysToComplete: 3,
    aiFlag: true,
  });

  addTicket({
    summary: 'Implement loading states and skeletons',
    description:
      'Add skeleton loaders during API calls. Show spinner on button clicks. Prevent double-submission of payment.',
    issueType: 'Story',
    status: 'Done',
    statusCategory: 'Done',
    discipline: 'frontend',
    labels: ['frontend', 'ux', 'loading'],
    complexity: 'S',
    storyPoints: 3,
    assignee: TEAM.frontend[0],
    sprintId: SPRINTS[2].id,
    sprintName: SPRINTS[2].name,
    daysAgoCreated: 26,
    daysToComplete: 2,
    aiFlag: false,
  });

  addTicket({
    summary: 'Add error handling and retry UI',
    description:
      'Display user-friendly error messages. Add retry buttons for failed operations. Log errors to monitoring.',
    issueType: 'Story',
    status: 'Done',
    statusCategory: 'Done',
    discipline: 'frontend',
    labels: ['frontend', 'error-handling', 'ux'],
    complexity: 'M',
    storyPoints: 5,
    assignee: TEAM.frontend[1],
    sprintId: SPRINTS[2].id,
    sprintName: SPRINTS[2].name,
    daysAgoCreated: 25,
    daysToComplete: 3,
    aiFlag: false,
  });

  addTicket({
    summary: 'Integrate analytics tracking',
    description:
      'Track checkout funnel: cart_viewed, checkout_started, shipping_entered, payment_entered, order_completed, payment_failed.',
    issueType: 'Story',
    status: 'Done',
    statusCategory: 'Done',
    discipline: 'frontend',
    labels: ['frontend', 'analytics', 'tracking'],
    complexity: 'M',
    storyPoints: 5,
    assignee: TEAM.frontend[2],
    sprintId: SPRINTS[2].id,
    sprintName: SPRINTS[2].name,
    daysAgoCreated: 24,
    daysToComplete: 3,
    aiFlag: true,
  });

  addTicket({
    summary: 'Implement email receipt service',
    description:
      'Send order confirmation email with: order details, receipt PDF, tracking link. Use SendGrid for delivery.',
    issueType: 'Story',
    status: 'Done',
    statusCategory: 'Done',
    discipline: 'backend',
    labels: ['backend', 'email', 'notifications'],
    complexity: 'M',
    storyPoints: 5,
    assignee: TEAM.backend[2],
    sprintId: SPRINTS[2].id,
    sprintName: SPRINTS[2].name,
    daysAgoCreated: 26,
    daysToComplete: 4,
    aiFlag: false,
  });

  // Testing tickets
  addTicket({
    summary: 'Write unit tests for payment service',
    description:
      'Test coverage for: payment processing, webhook handling, retry logic, idempotency. Target 90% coverage.',
    issueType: 'Task',
    status: 'Done',
    statusCategory: 'Done',
    discipline: 'qa',
    labels: ['testing', 'unit-test', 'backend'],
    complexity: 'L',
    storyPoints: 8,
    assignee: TEAM.qa[0],
    sprintId: SPRINTS[2].id,
    sprintName: SPRINTS[2].name,
    daysAgoCreated: 23,
    daysToComplete: 5,
    aiFlag: false,
  });

  addTicket({
    summary: 'Create integration tests for checkout API',
    description:
      'End-to-end API tests: create order, process payment, verify webhook handling, check order status updates.',
    issueType: 'Task',
    status: 'Done',
    statusCategory: 'Done',
    discipline: 'qa',
    labels: ['testing', 'integration', 'api'],
    complexity: 'L',
    storyPoints: 8,
    assignee: TEAM.qa[0],
    sprintId: SPRINTS[2].id,
    sprintName: SPRINTS[2].name,
    daysAgoCreated: 22,
    daysToComplete: 4,
    aiFlag: true,
  });

  addTicket({
    summary: 'E2E tests for checkout happy path',
    description:
      'Playwright tests: add to cart, enter shipping, enter payment, complete order. Test on Chrome, Firefox, Safari.',
    issueType: 'Task',
    status: 'Done',
    statusCategory: 'Done',
    discipline: 'qa',
    labels: ['testing', 'e2e', 'playwright'],
    complexity: 'L',
    storyPoints: 8,
    assignee: TEAM.qa[1],
    sprintId: SPRINTS[2].id,
    sprintName: SPRINTS[2].name,
    daysAgoCreated: 21,
    daysToComplete: 5,
    aiFlag: false,
  });

  addTicket({
    summary: 'Test payment failure scenarios',
    description:
      'Test: declined cards, insufficient funds, expired cards, network errors, 3DS challenges. Verify error messages.',
    issueType: 'Task',
    status: 'Done',
    statusCategory: 'Done',
    discipline: 'qa',
    labels: ['testing', 'error-handling', 'payments'],
    complexity: 'M',
    storyPoints: 5,
    assignee: TEAM.qa[0],
    sprintId: SPRINTS[2].id,
    sprintName: SPRINTS[2].name,
    daysAgoCreated: 20,
    daysToComplete: 3,
    aiFlag: false,
  });

  addTicket({
    summary: 'Mobile testing on physical devices',
    description:
      'Test checkout flow on: iPhone 14, iPhone SE, Pixel 7, Samsung S23. Verify Apple Pay and Google Pay.',
    issueType: 'Task',
    status: 'Done',
    statusCategory: 'Done',
    discipline: 'qa',
    labels: ['testing', 'mobile', 'devices'],
    complexity: 'M',
    storyPoints: 5,
    assignee: TEAM.qa[1],
    sprintId: SPRINTS[2].id,
    sprintName: SPRINTS[2].name,
    daysAgoCreated: 19,
    daysToComplete: 3,
    aiFlag: false,
  });

  addTicket({
    summary: 'Load testing payment endpoint',
    description:
      'Use k6 to simulate 1000 concurrent checkouts. Verify <500ms p95 latency. Identify bottlenecks.',
    issueType: 'Task',
    status: 'Done',
    statusCategory: 'Done',
    discipline: 'qa',
    labels: ['testing', 'performance', 'load-test'],
    complexity: 'M',
    storyPoints: 5,
    assignee: TEAM.qa[0],
    sprintId: SPRINTS[2].id,
    sprintName: SPRINTS[2].name,
    daysAgoCreated: 18,
    daysToComplete: 2,
    aiFlag: true,
  });

  addTicket({
    summary: 'Security audit for payment handling',
    description:
      'Review: PCI compliance, data encryption, token handling, XSS prevention, CSRF protection. Document findings.',
    issueType: 'Task',
    status: 'Done',
    statusCategory: 'Done',
    discipline: 'qa',
    labels: ['testing', 'security', 'audit'],
    complexity: 'L',
    storyPoints: 8,
    assignee: TEAM.qa[0],
    sprintId: SPRINTS[2].id,
    sprintName: SPRINTS[2].name,
    daysAgoCreated: 17,
    daysToComplete: 4,
    aiFlag: false,
  });

  // Sprint 4: Deployment & Polish
  // DevOps tickets
  addTicket({
    summary: 'Set up staging environment for checkout',
    description:
      'Configure staging: database, Redis cache, Stripe test mode, monitoring. Mirror production setup.',
    issueType: 'Task',
    status: 'Done',
    statusCategory: 'Done',
    discipline: 'devops',
    labels: ['devops', 'staging', 'infrastructure'],
    complexity: 'M',
    storyPoints: 5,
    assignee: TEAM.devops[0],
    sprintId: SPRINTS[3].id,
    sprintName: SPRINTS[3].name,
    daysAgoCreated: 14,
    daysToComplete: 3,
    aiFlag: false,
  });

  addTicket({
    summary: 'Configure feature flags for rollout',
    description:
      'Set up LaunchDarkly flags: new_checkout_enabled, apple_pay_enabled, google_pay_enabled. Configure gradual rollout.',
    issueType: 'Task',
    status: 'Done',
    statusCategory: 'Done',
    discipline: 'devops',
    labels: ['devops', 'feature-flags', 'rollout'],
    complexity: 'S',
    storyPoints: 3,
    assignee: TEAM.devops[1],
    sprintId: SPRINTS[3].id,
    sprintName: SPRINTS[3].name,
    daysAgoCreated: 13,
    daysToComplete: 2,
    aiFlag: false,
  });

  addTicket({
    summary: 'Set up monitoring and alerting',
    description:
      'Configure Datadog dashboards: payment success rate, latency p95, error rate. Set up PagerDuty alerts.',
    issueType: 'Task',
    status: 'Done',
    statusCategory: 'Done',
    discipline: 'devops',
    labels: ['devops', 'monitoring', 'alerting'],
    complexity: 'M',
    storyPoints: 5,
    assignee: TEAM.devops[0],
    sprintId: SPRINTS[3].id,
    sprintName: SPRINTS[3].name,
    daysAgoCreated: 12,
    daysToComplete: 3,
    aiFlag: true,
  });

  addTicket({
    summary: 'Production deployment and cutover',
    description:
      'Blue-green deployment to production. Verify health checks. Enable feature flag for 10% of traffic.',
    issueType: 'Task',
    status: 'Done',
    statusCategory: 'Done',
    discipline: 'devops',
    labels: ['devops', 'deployment', 'production'],
    complexity: 'M',
    storyPoints: 5,
    assignee: TEAM.devops[0],
    sprintId: SPRINTS[3].id,
    sprintName: SPRINTS[3].name,
    daysAgoCreated: 10,
    daysToComplete: 2,
    aiFlag: false,
  });

  // Data/Analytics tickets
  addTicket({
    summary: 'Set up checkout conversion funnel',
    description:
      'Create Amplitude funnel: cart → checkout → shipping → payment → confirmation. Track drop-off at each step.',
    issueType: 'Task',
    status: 'Done',
    statusCategory: 'Done',
    discipline: 'data',
    labels: ['data', 'analytics', 'funnel'],
    complexity: 'M',
    storyPoints: 5,
    assignee: TEAM.data[0],
    sprintId: SPRINTS[3].id,
    sprintName: SPRINTS[3].name,
    daysAgoCreated: 11,
    daysToComplete: 3,
    aiFlag: false,
  });

  addTicket({
    summary: 'Build payment metrics dashboard',
    description:
      'Looker dashboard: daily payments, revenue, average order value, payment method breakdown, failure reasons.',
    issueType: 'Task',
    status: 'Done',
    statusCategory: 'Done',
    discipline: 'data',
    labels: ['data', 'dashboard', 'metrics'],
    complexity: 'M',
    storyPoints: 5,
    assignee: TEAM.data[0],
    sprintId: SPRINTS[3].id,
    sprintName: SPRINTS[3].name,
    daysAgoCreated: 9,
    daysToComplete: 3,
    aiFlag: true,
  });

  // In Progress tickets (Sprint 4)
  addTicket({
    summary: 'Add saved addresses feature',
    description:
      'Allow users to save multiple shipping addresses. Add address book management. Pre-fill shipping form.',
    issueType: 'Story',
    status: 'In Progress',
    statusCategory: 'In Progress',
    discipline: 'frontend',
    labels: ['frontend', 'feature', 'addresses'],
    complexity: 'M',
    storyPoints: 5,
    assignee: TEAM.frontend[0],
    sprintId: SPRINTS[3].id,
    sprintName: SPRINTS[3].name,
    daysAgoCreated: 7,
    daysToComplete: null,
    aiFlag: false,
  });

  addTicket({
    summary: 'Implement promo code support',
    description:
      'Add promo code input to checkout. Validate codes against backend. Display discount in cart summary.',
    issueType: 'Story',
    status: 'In Progress',
    statusCategory: 'In Progress',
    discipline: 'backend',
    labels: ['backend', 'feature', 'promotions'],
    complexity: 'M',
    storyPoints: 5,
    assignee: TEAM.backend[1],
    sprintId: SPRINTS[3].id,
    sprintName: SPRINTS[3].name,
    daysAgoCreated: 6,
    daysToComplete: null,
    aiFlag: true,
  });

  addTicket({
    summary: 'Add gift card payment option',
    description:
      'Support gift card redemption. Allow partial payment with gift card + credit card. Track gift card balance.',
    issueType: 'Story',
    status: 'In Progress',
    statusCategory: 'In Progress',
    discipline: 'backend',
    labels: ['backend', 'feature', 'gift-cards'],
    complexity: 'L',
    storyPoints: 8,
    assignee: TEAM.backend[0],
    sprintId: SPRINTS[3].id,
    sprintName: SPRINTS[3].name,
    daysAgoCreated: 5,
    daysToComplete: null,
    aiFlag: false,
  });

  addTicket({
    summary: 'Implement express checkout widget',
    description:
      'Mini checkout widget for product pages. One-click buy with saved payment method. Reduce checkout friction.',
    issueType: 'Story',
    status: 'In Progress',
    statusCategory: 'In Progress',
    discipline: 'frontend',
    labels: ['frontend', 'feature', 'express-checkout'],
    complexity: 'L',
    storyPoints: 8,
    assignee: TEAM.frontend[1],
    sprintId: SPRINTS[3].id,
    sprintName: SPRINTS[3].name,
    daysAgoCreated: 4,
    daysToComplete: null,
    aiFlag: true,
  });

  addTicket({
    summary: 'UAT testing with stakeholders',
    description:
      'Conduct user acceptance testing with product team. Document feedback. Create bug tickets for issues found.',
    issueType: 'Task',
    status: 'In Progress',
    statusCategory: 'In Progress',
    discipline: 'qa',
    labels: ['testing', 'uat', 'stakeholders'],
    complexity: 'M',
    storyPoints: 5,
    assignee: TEAM.qa[1],
    sprintId: SPRINTS[3].id,
    sprintName: SPRINTS[3].name,
    daysAgoCreated: 3,
    daysToComplete: null,
    aiFlag: false,
  });

  // To Do tickets (backlog for next sprint)
  addTicket({
    summary: 'Add PayPal checkout option',
    description:
      'Integrate PayPal as payment method. Support PayPal Express Checkout. Handle PayPal webhooks.',
    issueType: 'Story',
    status: 'To Do',
    statusCategory: 'To Do',
    discipline: 'backend',
    labels: ['backend', 'payments', 'paypal'],
    complexity: 'L',
    storyPoints: 8,
    assignee: TEAM.backend[2],
    sprintId: SPRINTS[3].id,
    sprintName: SPRINTS[3].name,
    daysAgoCreated: 2,
    daysToComplete: null,
    aiFlag: false,
  });

  addTicket({
    summary: 'Implement subscription checkout flow',
    description:
      'Support recurring payments for subscription products. Manage subscription lifecycle. Handle failed renewals.',
    issueType: 'Story',
    status: 'To Do',
    statusCategory: 'To Do',
    discipline: 'backend',
    labels: ['backend', 'subscriptions', 'payments'],
    complexity: 'XL',
    storyPoints: 13,
    assignee: TEAM.backend[0],
    sprintId: SPRINTS[3].id,
    sprintName: SPRINTS[3].name,
    daysAgoCreated: 2,
    daysToComplete: null,
    aiFlag: false,
  });

  addTicket({
    summary: 'Add multi-currency support',
    description:
      'Display prices in user currency. Handle currency conversion at checkout. Show original and converted prices.',
    issueType: 'Story',
    status: 'To Do',
    statusCategory: 'To Do',
    discipline: 'frontend',
    labels: ['frontend', 'internationalization', 'currency'],
    complexity: 'L',
    storyPoints: 8,
    assignee: TEAM.frontend[2],
    sprintId: SPRINTS[3].id,
    sprintName: SPRINTS[3].name,
    daysAgoCreated: 1,
    daysToComplete: null,
    aiFlag: false,
  });

  addTicket({
    summary: 'Implement checkout accessibility audit fixes',
    description:
      'Fix WCAG 2.1 AA violations: keyboard navigation, screen reader support, color contrast, focus indicators.',
    issueType: 'Task',
    status: 'To Do',
    statusCategory: 'To Do',
    discipline: 'frontend',
    labels: ['frontend', 'accessibility', 'a11y'],
    complexity: 'M',
    storyPoints: 5,
    assignee: TEAM.frontend[0],
    sprintId: SPRINTS[3].id,
    sprintName: SPRINTS[3].name,
    daysAgoCreated: 1,
    daysToComplete: null,
    aiFlag: false,
  });

  addTicket({
    summary: 'Add checkout localization',
    description:
      'Translate checkout flow: English, Spanish, French, German, Japanese. Use react-intl.',
    issueType: 'Story',
    status: 'To Do',
    statusCategory: 'To Do',
    discipline: 'frontend',
    labels: ['frontend', 'i18n', 'localization'],
    complexity: 'M',
    storyPoints: 5,
    assignee: TEAM.frontend[1],
    sprintId: SPRINTS[3].id,
    sprintName: SPRINTS[3].name,
    daysAgoCreated: 1,
    daysToComplete: null,
    aiFlag: false,
  });

  // ===== DATA QUALITY ISSUES - Intentional for testing =====

  // Missing story points - Critical severity (5 tickets)
  addTicket({
    summary: 'Investigate checkout timeout reports',
    description: 'Users reporting timeouts during peak hours. Need investigation.',
    issueType: 'Bug',
    status: 'To Do',
    statusCategory: 'To Do',
    discipline: 'backend',
    labels: ['bug', 'checkout'],
    complexity: 'M',
    storyPoints: 0, // Missing!
    assignee: TEAM.backend[0],
    sprintId: SPRINTS[3].id,
    sprintName: SPRINTS[3].name,
    daysAgoCreated: 1,
    daysToComplete: null,
    aiFlag: false,
  });

  addTicket({
    summary: 'Optimize database queries for cart service',
    description: 'Cart service queries are slow under load. Need optimization.',
    issueType: 'Task',
    status: 'To Do',
    statusCategory: 'To Do',
    discipline: 'backend',
    labels: ['performance', 'database'],
    complexity: 'L',
    storyPoints: 0, // Missing!
    assignee: TEAM.backend[1],
    sprintId: SPRINTS[3].id,
    sprintName: SPRINTS[3].name,
    daysAgoCreated: 2,
    daysToComplete: null,
    aiFlag: false,
  });

  addTicket({
    summary: 'Fix mobile layout issues on small screens',
    description: 'Checkout form has layout issues on iPhone SE and small Android devices.',
    issueType: 'Bug',
    status: 'In Progress',
    statusCategory: 'In Progress',
    discipline: 'frontend',
    labels: ['bug', 'mobile', 'responsive'],
    complexity: 'S',
    storyPoints: 0, // Missing!
    assignee: TEAM.frontend[2],
    sprintId: SPRINTS[3].id,
    sprintName: SPRINTS[3].name,
    daysAgoCreated: 3,
    daysToComplete: null,
    aiFlag: false,
  });

  addTicket({
    summary: 'Update payment method icons',
    description: 'Add icons for new payment methods: Klarna, Afterpay, Affirm.',
    issueType: 'Task',
    status: 'To Do',
    statusCategory: 'To Do',
    discipline: 'frontend',
    labels: ['ui', 'icons'],
    complexity: 'XS',
    storyPoints: 0, // Missing!
    assignee: TEAM.frontend[0],
    sprintId: SPRINTS[3].id,
    sprintName: SPRINTS[3].name,
    daysAgoCreated: 1,
    daysToComplete: null,
    aiFlag: false,
  });

  addTicket({
    summary: 'Research fraud detection solutions',
    description:
      'Evaluate fraud detection services: Sift, Riskified, Signifyd. Provide recommendation.',
    issueType: 'Research',
    status: 'To Do',
    statusCategory: 'To Do',
    discipline: 'backend',
    labels: ['research', 'security', 'fraud'],
    complexity: 'M',
    storyPoints: 0, // Missing!
    assignee: TEAM.backend[2],
    sprintId: SPRINTS[3].id,
    sprintName: SPRINTS[3].name,
    daysAgoCreated: 2,
    daysToComplete: null,
    aiFlag: true,
  });

  // Missing sprint IDs - Warning severity (4 tickets)
  addTicket({
    summary: 'Update payment gateway documentation',
    description: 'Documentation needs updating after Stripe integration.',
    issueType: 'Task',
    status: 'To Do',
    statusCategory: 'To Do',
    discipline: 'unknown',
    labels: ['documentation'],
    complexity: 'S',
    storyPoints: 2,
    assignee: TEAM.pm[0],
    sprintId: '', // Missing!
    sprintName: '',
    daysAgoCreated: 1,
    daysToComplete: null,
    aiFlag: false,
  });

  addTicket({
    summary: 'Clean up deprecated API endpoints',
    description: 'Remove old payment endpoints that are no longer in use.',
    issueType: 'Task',
    status: 'To Do',
    statusCategory: 'To Do',
    discipline: 'backend',
    labels: ['cleanup', 'api'],
    complexity: 'S',
    storyPoints: 3,
    assignee: TEAM.backend[1],
    sprintId: '', // Missing!
    sprintName: '',
    daysAgoCreated: 2,
    daysToComplete: null,
    aiFlag: false,
  });

  addTicket({
    summary: 'Refactor checkout form validation',
    description: 'Consolidate validation logic across checkout forms.',
    issueType: 'Task',
    status: 'To Do',
    statusCategory: 'To Do',
    discipline: 'frontend',
    labels: ['refactor', 'validation'],
    complexity: 'M',
    storyPoints: 5,
    assignee: TEAM.frontend[1],
    sprintId: '', // Missing!
    sprintName: '',
    daysAgoCreated: 1,
    daysToComplete: null,
    aiFlag: false,
  });

  addTicket({
    summary: 'Update team onboarding documentation',
    description: 'Add new checkout feature to developer onboarding guide.',
    issueType: 'Task',
    status: 'To Do',
    statusCategory: 'To Do',
    discipline: 'unknown',
    labels: ['documentation', 'onboarding'],
    complexity: 'S',
    storyPoints: 2,
    assignee: TEAM.pm[1],
    sprintId: '', // Missing!
    sprintName: '',
    daysAgoCreated: 1,
    daysToComplete: null,
    aiFlag: false,
  });

  // Missing labels - Info severity (3 tickets)
  addTicket({
    summary: 'Review PR feedback from security audit',
    description: 'Address comments from security review.',
    issueType: 'Task',
    status: 'In Progress',
    statusCategory: 'In Progress',
    discipline: 'backend',
    labels: [], // Missing!
    complexity: 'S',
    storyPoints: 2,
    assignee: TEAM.backend[1],
    sprintId: SPRINTS[3].id,
    sprintName: SPRINTS[3].name,
    daysAgoCreated: 2,
    daysToComplete: null,
    aiFlag: false,
  });

  addTicket({
    summary: 'Fix TypeScript strict mode errors',
    description: 'Enable strict mode and fix all type errors in checkout module.',
    issueType: 'Task',
    status: 'To Do',
    statusCategory: 'To Do',
    discipline: 'frontend',
    labels: [], // Missing!
    complexity: 'M',
    storyPoints: 5,
    assignee: TEAM.frontend[0],
    sprintId: SPRINTS[3].id,
    sprintName: SPRINTS[3].name,
    daysAgoCreated: 1,
    daysToComplete: null,
    aiFlag: false,
  });

  addTicket({
    summary: 'Update dependency versions',
    description: 'Update outdated npm packages and test for breaking changes.',
    issueType: 'Task',
    status: 'To Do',
    statusCategory: 'To Do',
    discipline: 'devops',
    labels: [], // Missing!
    complexity: 'S',
    storyPoints: 3,
    assignee: TEAM.devops[1],
    sprintId: SPRINTS[3].id,
    sprintName: SPRINTS[3].name,
    daysAgoCreated: 1,
    daysToComplete: null,
    aiFlag: false,
  });

  return tickets;
}

const db = getDatabase();

function getDateDaysAgo(daysAgo: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date;
}

function seedCaseStudy(): string {
  const id = randomUUID();
  const now = new Date().toISOString();
  const startDate = getDateDaysAgo(56).toISOString(); // 8 weeks ago
  const endDate = getDateDaysAgo(0).toISOString();

  db.prepare(
    `
    INSERT INTO case_studies (
      id, name, type, jira_project_key, github_owner, github_repo,
      imported_at, status, ticket_count, event_count, start_date, end_date, created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `
  ).run(
    id,
    CASE_STUDY_NAME,
    'project',
    JIRA_PROJECT,
    GITHUB_OWNER,
    GITHUB_REPO,
    now,
    'completed',
    50,
    500,
    startDate,
    endDate,
    now
  );

  console.log(`Created case study: ${id} (${CASE_STUDY_NAME})`);
  return id;
}

function seedTicket(caseStudyId: string, ticket: SeedTicket): string {
  const id = randomUUID();
  const now = new Date();
  const createdAt = getDateDaysAgo(ticket.daysAgoCreated);
  const resolvedAt = ticket.daysToComplete
    ? new Date(createdAt.getTime() + ticket.daysToComplete * 24 * 60 * 60 * 1000)
    : null;

  // Calculate lead time and cycle time in milliseconds
  const leadTime = resolvedAt ? resolvedAt.getTime() - createdAt.getTime() : null;
  // Cycle time is typically shorter (active work time) - simulate as 60-80% of lead time
  const cycleTime = leadTime ? Math.floor(leadTime * (0.6 + Math.random() * 0.2)) : null;

  const rawJiraData = {
    id: ticket.key,
    key: ticket.key,
    fields: {
      summary: ticket.summary,
      description: ticket.description,
      issuetype: { name: ticket.issueType },
      status: {
        name: ticket.status,
        statusCategory: { key: ticket.statusCategory.toLowerCase().replace(' ', '') },
      },
      priority: { name: 'Medium' },
      labels: ticket.labels,
      assignee: { displayName: ticket.assignee, accountId: ticket.assignee },
      reporter: { displayName: TEAM.pm[0], accountId: TEAM.pm[0] },
      created: createdAt.toISOString(),
      updated: now.toISOString(),
      resolutiondate: resolvedAt?.toISOString() ?? null,
      customfield_10020: ticket.storyPoints, // Story points
      sprint: { id: ticket.sprintId, name: ticket.sprintName },
    },
  };

  db.prepare(
    `
    INSERT INTO jira_tickets (
      id, case_study_id, jira_id, jira_key, summary, description, issue_type, priority,
      current_status, status_category, assignee_id, assignee_name, reporter_id, reporter_name,
      sprint_id, sprint_name, story_points, created_at, updated_at, resolved_at,
      lead_time, cycle_time, complexity_size, discipline, ai_flag, raw_jira_data
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `
  ).run(
    id,
    caseStudyId,
    ticket.key,
    ticket.key,
    ticket.summary,
    ticket.description,
    ticket.issueType,
    'Medium',
    ticket.status,
    ticket.statusCategory,
    ticket.assignee,
    ticket.assignee,
    TEAM.pm[0],
    TEAM.pm[0],
    ticket.sprintId,
    ticket.sprintName,
    ticket.storyPoints,
    createdAt.toISOString(),
    now.toISOString(),
    resolvedAt?.toISOString() ?? null,
    leadTime,
    cycleTime,
    ticket.complexity,
    ticket.discipline,
    ticket.aiFlag ? 1 : 0,
    JSON.stringify(rawJiraData)
  );

  return id;
}

function seedLifecycleEvents(caseStudyId: string, ticket: SeedTicket): void {
  const now = new Date();
  const createdAt = getDateDaysAgo(ticket.daysAgoCreated);
  const resolvedAt = ticket.daysToComplete
    ? new Date(createdAt.getTime() + ticket.daysToComplete * 24 * 60 * 60 * 1000)
    : null;

  const events: Array<{
    type: EventType;
    source: 'jira' | 'github';
    date: Date;
    actor: string;
    details: Record<string, unknown>;
  }> = [];

  // 1. Ticket created event
  events.push({
    type: EventType.TICKET_CREATED,
    source: 'jira',
    date: createdAt,
    actor: TEAM.pm[0],
    details: { summary: ticket.summary, issueType: ticket.issueType },
  });

  // 2. Status transitions based on status category
  if (ticket.statusCategory === 'In Progress' || ticket.statusCategory === 'Done') {
    // Moved to In Progress
    const inProgressDate = new Date(createdAt.getTime() + 2 * 60 * 60 * 1000); // 2 hours after creation
    events.push({
      type: EventType.STATUS_CHANGED,
      source: 'jira',
      date: inProgressDate,
      actor: ticket.assignee,
      details: { fromStatus: 'To Do', toStatus: 'In Progress' },
    });

    // Assignee changed
    events.push({
      type: EventType.ASSIGNEE_CHANGED,
      source: 'jira',
      date: new Date(inProgressDate.getTime() + 1000),
      actor: ticket.assignee,
      details: { fromAssignee: null, toAssignee: ticket.assignee },
    });

    // For development/backend/frontend tickets, add GitHub events
    if (['backend', 'frontend', 'mobile', 'devops'].includes(ticket.discipline)) {
      const workDuration = ticket.daysToComplete ?? 5;
      const commitCount = Math.floor(workDuration * 1.5) + 1; // ~1.5 commits per day

      // Branch created
      const branchDate = new Date(inProgressDate.getTime() + 30 * 60 * 1000); // 30 min after starting
      events.push({
        type: EventType.BRANCH_CREATED,
        source: 'github',
        date: branchDate,
        actor: ticket.assignee,
        details: { branchName: `feature/${ticket.key.toLowerCase()}`, baseBranch: 'main' },
      });

      // Multiple commits spread over work duration
      for (let i = 0; i < commitCount; i++) {
        const commitDate = new Date(
          branchDate.getTime() + ((i + 1) / (commitCount + 1)) * workDuration * 24 * 60 * 60 * 1000
        );
        events.push({
          type: EventType.COMMIT_CREATED,
          source: 'github',
          date: commitDate,
          actor: ticket.assignee,
          details: {
            sha: randomUUID().substring(0, 8),
            message: `${ticket.key}: ${i === 0 ? 'Initial implementation' : i === commitCount - 1 ? 'Final polish' : 'Work in progress'}`,
            additions: Math.floor(Math.random() * 200) + 10,
            deletions: Math.floor(Math.random() * 50),
          },
        });
      }

      // PR opened (80% through work)
      if (ticket.statusCategory === 'Done' && resolvedAt) {
        const prOpenDate = new Date(createdAt.getTime() + workDuration * 0.8 * 24 * 60 * 60 * 1000);
        events.push({
          type: EventType.PR_OPENED,
          source: 'github',
          date: prOpenDate,
          actor: ticket.assignee,
          details: {
            prNumber: Math.floor(Math.random() * 1000) + 100,
            title: `${ticket.key}: ${ticket.summary}`,
            baseBranch: 'main',
            headBranch: `feature/${ticket.key.toLowerCase()}`,
          },
        });

        // PR reviewed
        const reviewer =
          TEAM.backend[Math.floor(Math.random() * TEAM.backend.length)] !== ticket.assignee
            ? TEAM.backend[Math.floor(Math.random() * TEAM.backend.length)]
            : TEAM.frontend[0];
        events.push({
          type: EventType.PR_REVIEWED,
          source: 'github',
          date: new Date(prOpenDate.getTime() + 4 * 60 * 60 * 1000), // 4 hours later
          actor: reviewer,
          details: { state: 'approved', comments: Math.floor(Math.random() * 5) },
        });

        // PR approved
        events.push({
          type: EventType.PR_APPROVED,
          source: 'github',
          date: new Date(prOpenDate.getTime() + 5 * 60 * 60 * 1000),
          actor: reviewer,
          details: { approver: reviewer },
        });

        // PR merged
        events.push({
          type: EventType.PR_MERGED,
          source: 'github',
          date: new Date(prOpenDate.getTime() + 6 * 60 * 60 * 1000),
          actor: ticket.assignee,
          details: { mergedBy: ticket.assignee, baseBranch: 'main' },
        });
      }
    }

    // Move to In Review (for Done tickets)
    if (ticket.statusCategory === 'Done' && resolvedAt) {
      const inReviewDate = new Date(
        createdAt.getTime() + (ticket.daysToComplete ?? 3) * 0.7 * 24 * 60 * 60 * 1000
      );
      events.push({
        type: EventType.STATUS_CHANGED,
        source: 'jira',
        date: inReviewDate,
        actor: ticket.assignee,
        details: { fromStatus: 'In Progress', toStatus: 'In Review' },
      });

      // Move to Done
      events.push({
        type: EventType.STATUS_CHANGED,
        source: 'jira',
        date: resolvedAt,
        actor: ticket.assignee,
        details: { fromStatus: 'In Review', toStatus: 'Done' },
      });

      // Resolved event
      events.push({
        type: EventType.RESOLVED,
        source: 'jira',
        date: resolvedAt,
        actor: ticket.assignee,
        details: { resolution: 'Done' },
      });
    }
  }

  // Sort events by date
  events.sort((a, b) => a.date.getTime() - b.date.getTime());

  // Insert all events
  for (const event of events) {
    const eventId = randomUUID();
    db.prepare(
      `
      INSERT INTO lifecycle_events (
        id, case_study_id, ticket_key, event_type, event_source, event_date,
        actor_name, actor_id, details, discipline, complexity_size, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    ).run(
      eventId,
      caseStudyId,
      ticket.key,
      event.type,
      event.source,
      event.date.toISOString(),
      event.actor,
      event.actor,
      JSON.stringify(event.details),
      ticket.discipline,
      ticket.complexity,
      now.toISOString()
    );

    // Also create normalized event
    const normalizedId = randomUUID();
    db.prepare(
      `
      INSERT INTO normalized_events (
        id, case_study_id, ticket_key, event_type, event_source, occurred_at,
        actor_name, actor_id, discipline, complexity_size, details, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    ).run(
      normalizedId,
      caseStudyId,
      ticket.key,
      event.type,
      event.source,
      event.date.toISOString(),
      event.actor,
      event.actor,
      ticket.discipline,
      ticket.complexity,
      JSON.stringify(event.details),
      now.toISOString()
    );
  }
}

function main() {
  console.log('Starting comprehensive seed data generation...\n');

  try {
    // Check if case study already exists
    const existing = db
      .prepare('SELECT COUNT(*) as count FROM case_studies WHERE name = ?')
      .get(CASE_STUDY_NAME) as { count: number };

    if (existing.count > 0) {
      console.log(`Case study "${CASE_STUDY_NAME}" already exists. Skipping.\n`);
      console.log('To regenerate, delete existing case study first.');
      return;
    }

    const caseStudyId = seedCaseStudy();
    const tickets = generateTickets();

    // Count statistics
    const stats = {
      total: tickets.length,
      done: tickets.filter((t) => t.statusCategory === 'Done').length,
      inProgress: tickets.filter((t) => t.statusCategory === 'In Progress').length,
      toDo: tickets.filter((t) => t.statusCategory === 'To Do').length,
      byDiscipline: {} as Record<string, number>,
      byComplexity: {} as Record<string, number>,
      totalPoints: 0,
      aiAssisted: tickets.filter((t) => t.aiFlag).length,
    };

    for (const ticket of tickets) {
      stats.byDiscipline[ticket.discipline] = (stats.byDiscipline[ticket.discipline] || 0) + 1;
      stats.byComplexity[ticket.complexity] = (stats.byComplexity[ticket.complexity] || 0) + 1;
      stats.totalPoints += ticket.storyPoints;
    }

    console.log('\nGenerating tickets and events...');
    let eventCount = 0;

    for (const ticket of tickets) {
      seedTicket(caseStudyId, ticket);
      seedLifecycleEvents(caseStudyId, ticket);
      eventCount +=
        ticket.statusCategory === 'Done' ? 12 : ticket.statusCategory === 'In Progress' ? 4 : 1;
    }

    console.log('\n=== Seed Data Summary ===');
    console.log(`Case Study: ${CASE_STUDY_NAME}`);
    console.log(`Total Tickets: ${stats.total}`);
    console.log(`  - Done: ${stats.done}`);
    console.log(`  - In Progress: ${stats.inProgress}`);
    console.log(`  - To Do: ${stats.toDo}`);
    console.log(`\nBy Discipline:`);
    for (const [discipline, count] of Object.entries(stats.byDiscipline)) {
      console.log(`  - ${discipline}: ${count}`);
    }
    console.log(`\nBy Complexity:`);
    for (const size of ['XS', 'S', 'M', 'L', 'XL']) {
      console.log(`  - ${size}: ${stats.byComplexity[size] || 0}`);
    }
    console.log(`\nTotal Story Points: ${stats.totalPoints}`);
    console.log(`AI-Assisted Tickets: ${stats.aiAssisted}`);
    console.log(`Estimated Events: ~${eventCount}`);
    console.log(`\nSprints: ${SPRINTS.length}`);
    for (const sprint of SPRINTS) {
      const sprintTickets = tickets.filter(
        (t) => t.sprintId === sprint.id && t.statusCategory === 'Done'
      );
      const points = sprintTickets.reduce((sum, t) => sum + t.storyPoints, 0);
      console.log(
        `  - ${sprint.name}: ${points} points (${sprintTickets.length} completed tickets)`
      );
    }

    console.log('\n✓ Seed data generation complete!');
  } catch (error) {
    console.error('Error generating seed data:', error);
    process.exit(1);
  }
}

main();
