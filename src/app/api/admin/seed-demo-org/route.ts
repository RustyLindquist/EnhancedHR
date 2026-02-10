import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { embedContextItem } from '@/lib/context-embeddings';

export const runtime = 'nodejs';
export const maxDuration = 120;

// ============================================================================
// Configuration
// ============================================================================

const ORG_NAME = 'Luminous';
const ORG_SLUG = 'luminous';
const DEMO_PASSWORD = 'password123';

interface EmployeeConfig {
  email: string;
  name: string;
  headline: string;
  membershipStatus: 'org_admin' | 'employee';
  platformRole: 'admin' | 'user';
}

const EXISTING_ACCOUNTS: EmployeeConfig[] = [
  { email: 'demo.admin@enhancedhr.ai', name: 'Jordan Rivera', headline: 'Head of People Operations', membershipStatus: 'org_admin', platformRole: 'admin' },
  { email: 'demo.employee@enhancedhr.ai', name: 'Taylor Mitchell', headline: 'Software Engineer', membershipStatus: 'employee', platformRole: 'user' },
  { email: 'test@test.com', name: 'Casey Park', headline: 'Product Designer', membershipStatus: 'employee', platformRole: 'user' },
];

const NEW_EMPLOYEES: EmployeeConfig[] = [
  { email: 'sarah.chen@luminous.io', name: 'Sarah Chen', headline: 'Chief People Officer', membershipStatus: 'org_admin', platformRole: 'user' },
  { email: 'marcus.williams@luminous.io', name: 'Marcus Williams', headline: 'VP, Talent & Culture', membershipStatus: 'org_admin', platformRole: 'user' },
  { email: 'priya.sharma@luminous.io', name: 'Priya Sharma', headline: 'HR Business Partner', membershipStatus: 'employee', platformRole: 'user' },
  { email: 'james.okafor@luminous.io', name: 'James Okafor', headline: 'L&D Manager', membershipStatus: 'employee', platformRole: 'user' },
  { email: 'elena.rodriguez@luminous.io', name: 'Elena Rodriguez', headline: 'Engineering Manager', membershipStatus: 'employee', platformRole: 'user' },
  { email: 'david.kim@luminous.io', name: 'David Kim', headline: 'Compensation & Benefits Analyst', membershipStatus: 'employee', platformRole: 'user' },
  { email: 'aisha.patel@luminous.io', name: 'Aisha Patel', headline: 'Talent Acquisition Lead', membershipStatus: 'employee', platformRole: 'user' },
  { email: 'ryan.thompson@luminous.io', name: 'Ryan Thompson', headline: 'Customer Success Lead', membershipStatus: 'employee', platformRole: 'user' },
  { email: 'maria.gonzalez@luminous.io', name: 'Maria Gonzalez', headline: 'HRIS Administrator', membershipStatus: 'employee', platformRole: 'user' },
  { email: 'nathan.brooks@luminous.io', name: 'Nathan Brooks', headline: 'HR Coordinator (New Hire)', membershipStatus: 'employee', platformRole: 'user' },
];

const GROUP_CONFIG = [
  { name: 'HR Leadership', members: ['sarah.chen@luminous.io', 'marcus.williams@luminous.io', 'demo.admin@enhancedhr.ai'] },
  { name: 'Learning & Development', members: ['marcus.williams@luminous.io', 'james.okafor@luminous.io', 'priya.sharma@luminous.io'] },
  { name: 'People Operations', members: ['priya.sharma@luminous.io', 'david.kim@luminous.io', 'aisha.patel@luminous.io', 'maria.gonzalez@luminous.io', 'nathan.brooks@luminous.io'] },
  { name: 'Engineering & Product', members: ['elena.rodriguez@luminous.io', 'ryan.thompson@luminous.io', 'demo.employee@enhancedhr.ai', 'test@test.com'] },
];

const ASSIGNMENT_CONFIG = [
  { assigneeType: 'org', assigneeEmail: null, courseTitle: 'The Control Spectrum', type: 'required', groupName: null },
  { assigneeType: 'org', assigneeEmail: null, courseTitle: 'Leadership and Trust - Orient (1 of 4)', type: 'recommended', groupName: null },
  { assigneeType: 'group', assigneeEmail: null, courseTitle: 'The Five Voices', type: 'required', groupName: 'HR Leadership' },
  { assigneeType: 'group', assigneeEmail: null, courseTitle: 'Leadership and Resilience', type: 'recommended', groupName: 'HR Leadership' },
  { assigneeType: 'group', assigneeEmail: null, courseTitle: 'Perspective and Identity', type: 'required', groupName: 'Learning & Development' },
  { assigneeType: 'group', assigneeEmail: null, courseTitle: 'Engagement During Leadership Transition', type: 'recommended', groupName: 'Learning & Development' },
  { assigneeType: 'group', assigneeEmail: null, courseTitle: 'Momentum and Alignment', type: 'recommended', groupName: 'Engineering & Product' },
  { assigneeType: 'user', assigneeEmail: 'nathan.brooks@luminous.io', courseTitle: 'The Control Spectrum', type: 'required', groupName: null },
  { assigneeType: 'user', assigneeEmail: 'sarah.chen@luminous.io', courseTitle: 'Objective and Plan', type: 'recommended', groupName: null },
];

const CONVERSATION_TITLES = [
  { email: 'sarah.chen@luminous.io', title: 'How does our parental leave policy work?' },
  { email: 'marcus.williams@luminous.io', title: 'Leadership development plan for Q2' },
  { email: 'priya.sharma@luminous.io', title: 'Preparing for difficult performance conversation' },
  { email: 'elena.rodriguez@luminous.io', title: 'AI tools approved for our team?' },
  { email: 'ryan.thompson@luminous.io', title: 'Onboarding checklist for new engineering hire' },
  { email: 'david.kim@luminous.io', title: 'Understanding our performance review process' },
  { email: 'james.okafor@luminous.io', title: 'Best practices for remote team building' },
  { email: 'nathan.brooks@luminous.io', title: 'Role disruption analysis for HR coordinator' },
  { email: 'aisha.patel@luminous.io', title: 'Creating effective 1:1 agendas' },
  { email: 'maria.gonzalez@luminous.io', title: 'Benefits comparison for new hire offer' },
  { email: 'demo.admin@enhancedhr.ai', title: 'Cross-team collaboration strategies' },
  { email: 'elena.rodriguez@luminous.io', title: 'New manager transition support' },
];

// ============================================================================
// Collection Content
// ============================================================================

const COMPANY_KB_ITEMS = [
  {
    title: 'Luminous - Mission, Vision & Values',
    text: `Luminous is a technology company dedicated to building intelligent software solutions that empower organizations to work smarter. Founded in 2019, we've grown to over 150 team members across engineering, product, design, sales, and operations.

Our Mission: To create technology that amplifies human potential and transforms how organizations operate.

Our Vision: A world where every organization has access to intelligent tools that make their teams more effective, informed, and connected.

Our Core Values:

Build with Purpose — Every feature we ship, every line of code we write, and every decision we make should connect back to real impact for our customers. We don't build for the sake of building. We ask "who does this help?" before we ask "how do we build it?" Purpose drives our product roadmap, our hiring, and our daily prioritization.

Lead with Empathy — Whether we're working with customers, collaborating across teams, or giving feedback to a colleague, empathy is our starting point. We assume good intent. We listen before we respond. We recognize that behind every support ticket is a person, and behind every pull request is a teammate who cares about their craft.

Grow Relentlessly — We believe that learning is a competitive advantage. Every team member is expected to invest in their growth, whether through our $3,000 annual L&D budget, internal knowledge sharing, or stretch assignments. We celebrate curiosity. We normalize not knowing. We promote people who teach others.

Win as One — Individual brilliance matters less than collective excellence. We share credit generously, escalate blockers early, and optimize for the team's velocity over personal metrics. Cross-functional collaboration isn't a buzzword here — it's how we ship.

Our Culture: We are remote-first and async-first, with team members across multiple time zones. We value output over hours, clarity over meetings, and documentation over tribal knowledge. We believe that a great company is one where people do the best work of their careers while maintaining the lives they want to live.`
  },
  {
    title: 'Employee Handbook - Remote & Hybrid Work Policy',
    text: `At Luminous, we operate as a remote-first, async-first company. This policy outlines how we work, where we work, and the principles that keep us productive and connected.

Work Location: Team members may work from anywhere within their approved country of employment. We do not require office attendance. For team members near our hubs in Austin, TX and Denver, CO, co-working space is available but entirely optional.

Core Collaboration Hours: To ensure overlap for synchronous communication, all team members are expected to be available during our core collaboration window: 10:00 AM - 2:00 PM Mountain Time, Monday through Friday. Outside of these hours, you're encouraged to structure your day around your personal peak productivity and life commitments.

Async-First Communication: Our default mode of communication is asynchronous. This means writing things down in Notion, Slack threads, or Loom videos rather than scheduling meetings. Before scheduling a meeting, ask: "Could this be a Slack thread or a doc?" If yes, choose the async option. Meetings are for alignment, decision-making, and relationship building — not status updates.

Home Office Stipend: Every full-time team member receives a one-time $1,500 home office stipend upon joining, to be used for desk, chair, monitor, keyboard, or other workspace essentials. Receipts should be submitted through Expensify within 90 days of hire. An additional $500 annual refresh stipend is available starting in your second year.

Video Meeting Norms: Cameras are encouraged but never required. We understand that some days you're at a coffee shop, managing childcare, or simply not feeling it. What matters is your presence and contribution, not your background. All recurring meetings should have an agenda shared at least 24 hours in advance. All meetings should produce written notes or action items posted to the relevant Slack channel or Notion page.

Time Off and Flexibility: We offer unlimited PTO with a minimum expectation of 15 days per year. We track minimums, not maximums. Managers are expected to model healthy time-off behavior. If you're sick, log off. If you need a mental health day, take it. No questions asked, no guilt trip.

Internet and Connectivity: Luminous reimburses up to $100/month for internet service. Reliable internet is a job requirement for remote work. If you experience connectivity issues, please work with IT to explore solutions including mobile hotspot reimbursement.`
  },
  {
    title: 'Benefits & Total Rewards Overview 2026',
    text: `Luminous is committed to providing a comprehensive benefits package that supports the whole person — your health, your finances, your growth, and your life outside of work.

Health & Wellness: We offer medical, dental, and vision insurance through Aetna, with Luminous covering 90% of premiums for employees and 70% for dependents. Plans include PPO and HDHP options with HSA eligibility. Mental health support is provided through Modern Health, giving every team member access to 10 coaching or therapy sessions per year at no cost. We also offer a $50/month wellness stipend for gym memberships, fitness apps, meditation subscriptions, or other wellness activities.

Financial Benefits: Our 401(k) plan through Guideline includes a 4% company match with immediate vesting. We believe your retirement savings shouldn't be contingent on tenure. Equity compensation is part of our offer for all full-time roles, with a standard four-year vesting schedule and one-year cliff. We conduct annual compensation reviews every April, benchmarked against market data from Radford and Levels.fyi.

Professional Development: Every team member receives a $3,000 annual learning and development budget. This can be used for courses, conferences, books, certifications, coaching, or any other professional growth investment. We encourage team members to use this fully. Unused L&D budget does not roll over. In addition to the personal L&D budget, Luminous provides access to EnhancedHR.ai's full course library, covering leadership, communication, AI literacy, and strategic HR topics.

Parental Leave: We offer 16 weeks of fully paid parental leave for all new parents, regardless of gender or whether the child joins the family through birth, adoption, or foster placement. An additional 4 weeks of part-time transition is available upon return, allowing you to ease back at 60% capacity with full pay.

Time Off: Unlimited PTO with a 15-day minimum. In addition, Luminous observes 11 company holidays plus a week-long company shutdown between Christmas and New Year's. We also offer 3 volunteer days per year for community service activities.

Additional Perks: $1,500 home office setup stipend (first year), $500 annual refresh stipend (year 2+), $100/month internet reimbursement, $50/month wellness stipend, company-provided MacBook Pro and peripherals, annual company retreat (last year: Park City, Utah).`
  },
  {
    title: 'Performance & Growth Framework',
    text: `At Luminous, we believe performance management should be a continuous conversation, not an annual event. Our framework is designed to promote growth, provide clarity, and ensure every team member knows where they stand and where they're headed.

Quarterly Growth Conversations: Every quarter, each team member has a structured 1:1 with their manager focused on three areas: Reflect (what went well, what was challenging, what did you learn), Align (are current priorities clear, are there blockers, is the role evolving as expected), and Grow (what skills are you developing, what stretch opportunities are available, how can your manager support you). These conversations are documented in Lattice and shared between manager and team member. They are not punitive — they are developmental.

Peer Feedback: Twice per year (Q2 and Q4), we run a lightweight peer feedback cycle. Each team member selects 3-5 peers to provide feedback on collaboration, communication, and impact. Feedback is shared directly with the team member (not anonymized) to promote a culture of openness. Managers use peer feedback to supplement their own observations and identify patterns.

Rating Scale: We use a 5-point rating scale assessed annually in Q4: (1) Below Expectations - Performance consistently falls short; improvement plan required. (2) Approaching Expectations - Some areas need development; focused coaching in progress. (3) Meeting Expectations - Solid, reliable performance; meeting role requirements well. (4) Exceeding Expectations - Consistently going above and beyond; strong impact. (5) Exceptional - Truly outstanding; redefining what's possible in the role.

Development Plans: Every team member is encouraged to maintain a personal development plan. This includes current strengths, growth areas, specific learning goals for the quarter, and career trajectory aspirations. Managers are expected to actively support development plans through stretch assignments, mentorship connections, and L&D budget guidance. Development plans are reviewed during quarterly growth conversations.

Promotions: Promotions at Luminous are based on demonstrated sustained performance at the next level, not tenure. We promote when someone is already consistently operating at the next level, not as an aspiration. Promotion cycles occur in Q1 and Q3. Managers submit promotion cases that include peer feedback, impact evidence, and alignment with the role's level expectations.`
  },
  {
    title: 'AI Usage & Data Ethics Policy',
    text: `Luminous embraces artificial intelligence as a tool to enhance productivity, creativity, and decision-making. This policy establishes guidelines for responsible AI usage across the company.

Approved AI Tools: The following AI tools are approved for use with non-sensitive company data: ChatGPT (GPT-4 and later), Claude (Anthropic), GitHub Copilot, Notion AI, Grammarly, and EnhancedHR.ai's Prometheus platform. Enterprise accounts with data protection agreements are provisioned for ChatGPT and Claude. Personal accounts should not be used for any work-related tasks.

Data Classification for AI: Before using any AI tool, consider the data you're inputting. Public data (marketing copy, public docs, open-source code) — approved for any AI tool. Internal data (internal memos, strategy docs, product roadmaps) — approved only with enterprise-licensed AI tools. Confidential data (customer data, financial projections, employee records, PII) — never input into any external AI tool. Restricted data (source code for core IP, security credentials, legal communications) — never input into any external AI tool. When in doubt, treat data as Confidential and check with your manager or the Security team.

AI Output Review: All AI-generated content must be reviewed by a human before being shared externally, published, or used in decision-making. AI outputs may contain errors, biases, or hallucinations. You are responsible for the accuracy and appropriateness of any AI-assisted work you deliver. AI-generated code must go through the standard code review process. AI-generated customer-facing content must be reviewed by the relevant team lead.

Prohibited Uses: Do not use AI to make final hiring, firing, or promotion decisions without human judgment. Do not use AI to generate legal contracts or binding agreements without legal review. Do not use AI to process or analyze customer data outside of approved, contractually-compliant platforms. Do not represent AI-generated work as original human work in contexts where originality is expected.

Reporting and Feedback: If you encounter an AI tool producing biased, harmful, or inaccurate outputs, report it to the #ai-ethics Slack channel. We maintain a quarterly AI usage review with the Security and Ethics committee. Suggestions for new AI tools or use cases can be submitted through the Technology Request form in Notion.`
  },
];

const MANAGER_HUB_ITEMS = [
  {
    title: 'New Manager Onboarding Guide',
    text: `Congratulations on your promotion to a management role at Luminous. The transition from individual contributor to manager is one of the most significant career shifts you'll experience. This guide outlines what to expect and what's expected of you in your first 90 days.

First 30 Days — Orient: Your primary job this month is to listen and learn. Schedule 1:1 introductory meetings with every direct report (30 minutes each). Use these to understand their current projects, career goals, working style preferences, and any concerns. Do not make process changes in the first month. Attend your team's existing meetings as an observer first. Complete the following required courses on EnhancedHR: Leadership and Trust (Orient), The Five Voices, and The Control Spectrum. Begin your weekly 1:1 cadence with your own manager. Review your team's current OKRs and understand how they connect to department and company goals.

Days 31-60 — Build: Begin establishing your management rhythm. Set up recurring 1:1s with each direct report (weekly, 30 minutes). Create a team communication charter: when to use Slack vs. email vs. meetings. Conduct your first team retrospective. Start identifying quick wins — small process improvements that demonstrate you're listening without disrupting workflow. Work with your manager to clarify your decision-making authority: what can you approve, what needs escalation? Begin documenting your team's processes and tribal knowledge. Complete the Difficult Conversations course on EnhancedHR.

Days 61-90 — Lead: By now you should have a clear picture of your team's strengths, gaps, and opportunities. Create your 90-day impact summary for your manager, covering: team assessment, process improvements implemented or proposed, individual development plans for each report, and your own development goals as a manager. Begin your first quarterly growth conversations with each direct report. Propose any structural or process changes you believe would improve team effectiveness. Seek feedback from your direct reports on your management style.

Mentor Assignment: Every new manager is paired with an experienced manager from a different department for their first 6 months. Your mentor will be assigned within your first week. Meet with them biweekly. They are a confidential sounding board for management challenges.

Resources: All courses assigned to your learning path, this Manager Development Hub collection, the 1:1 Meeting Templates document, and access to the Management Slack channel (#managers). Your HR Business Partner for your department is available for any people-related questions.`
  },
  {
    title: 'Difficult Conversations Playbook',
    text: `Difficult conversations are an inevitable part of management. Whether you're addressing underperformance, delivering critical feedback, navigating interpersonal conflict, or communicating organizational changes, your ability to handle these moments with clarity and empathy defines your effectiveness as a leader.

The CARE Framework: We use the CARE model for structuring difficult conversations:

Clarify — Before the conversation, get clear on what specifically you need to address. Write down the observable behavior or situation (not your interpretation of it). Define the impact: who is affected and how. Identify the outcome you want from this conversation. Avoid vague language like "your attitude needs to change." Instead: "In the last three team meetings, you've interrupted colleagues during their presentations, which has made several team members reluctant to share their ideas."

Acknowledge — Begin the conversation by acknowledging the person's perspective and the difficulty of the discussion. "I want to talk about something that might be uncomfortable, and I want you to know that my goal is to support you in being successful here." Listen to their side completely before responding. Acknowledge their feelings without necessarily agreeing with their assessment. Paraphrase what you hear to show understanding.

Respond — Share your observations factually and explain the impact. Use "I" statements: "I've noticed..." rather than "You always..." Connect the behavior to team or business impact. Be direct but not harsh. Avoid the feedback sandwich (praise-criticism-praise) — it dilutes the message and people stop trusting your positive feedback. Instead, be straightforward about what needs to change while maintaining respect.

Execute — End with clear, specific, measurable next steps. What will change? By when? How will you both know if it's working? Document the conversation and action items. Send a brief follow-up email summarizing what was discussed and agreed upon.

Documentation: All performance-related conversations must be documented in Lattice within 48 hours. Documentation should include: date, participants, key discussion points, agreed-upon action items, and follow-up timeline. Documentation protects both the manager and the employee.

When to Involve HR: Contact your HR Business Partner before the conversation if: the situation involves potential policy violations, you're considering a formal performance improvement plan, the conversation involves allegations of harassment or discrimination, you're unsure about legal or compliance implications, or you'd like coaching on how to approach a particularly sensitive topic.`
  },
  {
    title: '1:1 Meeting Templates & Best Practices',
    text: `Regular 1:1 meetings are the foundation of effective management at Luminous. These are your direct report's meetings — their time to surface concerns, ask for support, and discuss their growth. Here are templates for common 1:1 scenarios.

Weekly Check-In (30 minutes): This is your standard weekly 1:1. Suggested agenda: What's on your mind? (5 min) — Let them lead with whatever is top of mind. Progress and blockers (10 min) — Current project status, any obstacles, decisions needed. Priorities for the coming week (5 min) — Alignment on what matters most. Development and growth (5 min) — Quick check on learning goals, stretch opportunities. Action items and follow-ups (5 min) — Capture commitments from both sides. Best practice: Maintain a shared running doc (Notion) for each direct report. Both parties add agenda items throughout the week.

First 1:1 with a New Report (45 minutes): Use this template when you take over managing someone or when a new hire joins your team. Topics to cover: Tell me about yourself — background, what brought you here, what you enjoy about your work. Working style — How do you prefer to receive feedback? What does a good manager look like to you? When are you most productive? Communication preferences — Slack vs. email, response time expectations, camera-on preferences. Current state — What's going well? What's frustrating? What's one thing you'd change about the team if you could? Goals — Where do you want to be in 6 months? A year? Support — How can I be most helpful to you?

Career Growth 1:1 (45 minutes, monthly): Dedicated to longer-term development. Discussion areas: Progress on development plan goals. Skills you're actively building — what's working, what needs adjustment. Interest in new projects, stretch assignments, or cross-functional work. Feedback on growth trajectory — are you on track for your next career milestone? L&D budget usage and plans.

Performance Concern 1:1 (45 minutes): When you need to address a specific performance issue. Structure: State the purpose clearly upfront. Share 2-3 concrete examples with dates and impact. Ask for their perspective. Collaboratively identify root causes — skill gap, motivation, unclear expectations, personal circumstances? Agree on specific, measurable improvements with a timeline. Schedule a follow-up check-in. Document in Lattice within 48 hours.

Tips for Effective 1:1s: Never cancel a 1:1. If you must reschedule, reschedule — don't skip. Take notes during the conversation and share action items within 24 hours. Keep your phone away and laptop closed unless you're taking notes. Follow up on items from previous 1:1s — nothing erodes trust faster than forgotten commitments. Ask questions more than you give answers.`
  },
];

const KB_NOTE = {
  title: 'Q1 2026 People Team Priorities',
  content: `Strategic Priorities for Q1 2026

The People team has identified four key initiatives for this quarter:

1. Leadership Pipeline Program: Launch a formal leadership development cohort targeting high-potential individual contributors ready for their first management role. Partner with EnhancedHR.ai's Academy courses on trust, communication, and team dynamics. Target: identify 8 candidates, begin cohort by end of February.

2. DEIB Scorecard: Implement a quarterly diversity, equity, inclusion, and belonging scorecard that tracks representation metrics, belonging survey scores, pay equity analysis, and promotion velocity across demographics. First report due to the executive team by March 15.

3. AI Literacy Program: In partnership with Engineering, roll out an AI literacy program for all people managers. Focus areas: understanding AI capabilities relevant to their teams, responsible AI usage per our policy, and how to support team members through AI-driven role changes. Leverage the Role Disruption Forecasting tool for personalized assessments.

4. Engagement Survey Action Items: Following the Q4 engagement survey, three themes require focused attention: (a) career growth clarity — 34% of respondents want more visibility into promotion criteria, (b) cross-team collaboration — remote work has reduced organic connection between departments, (c) manager effectiveness — request for more structured 1:1 frameworks and feedback training.

Timeline: Monthly check-ins with the full People team on the 1st and 15th. Quarterly board update on People metrics due April 1.`
};

const MANAGER_NOTE = {
  title: 'Leadership Development Program - Cohort 3',
  content: `Leadership Development Program — Cohort 3 (Q1 2026)

Program Overview: Our third cohort of the emerging leaders program begins January 27, 2026. This 12-week program targets high-potential individual contributors who have been identified for management readiness. The program combines EnhancedHR Academy courses, peer coaching circles, and real-world stretch assignments.

Participants:
- Priya Sharma (HR Business Partner) — Mentor: Marcus Williams
- Elena Rodriguez (Engineering Manager) — Mentor: Jordan Rivera
- David Kim (Compensation & Benefits Analyst) — Mentor: Sarah Chen
- Aisha Patel (Talent Acquisition Lead) — Mentor: Marcus Williams

Schedule:
Weeks 1-4: Foundation — Complete Leadership and Trust: Orient + The Five Voices courses. Weekly 1-hour peer coaching circle (Thursdays 11 AM MT). Individual mentor check-in biweekly.
Weeks 5-8: Practice — Complete Leadership and Resilience course. Each participant leads a cross-functional initiative. Mid-program assessment with 360 feedback.
Weeks 9-12: Integration — Complete The Control Spectrum course. Final project: present a leadership challenge case study. Graduation and development plan for ongoing growth.

Success Metrics: Course completion rate (target: 100%). 360 feedback improvement from baseline. Participant NPS. Manager readiness assessment score. Promotion within 12 months of completion (target: 50%).

Budget: $2,400 total ($600 per participant for supplementary coaching and materials). L&D budget covers course access via EnhancedHR platform.

Program Lead: James Okafor (L&D Manager)
Executive Sponsor: Sarah Chen (Chief People Officer)`
};

// ============================================================================
// Helpers
// ============================================================================

function randomDateInLast30Days(): Date {
  const now = new Date();
  const daysAgo = Math.floor(Math.random() * 30);
  const date = new Date(now);
  date.setDate(date.getDate() - daysAgo);
  const day = date.getDay();
  if (day === 0 || day === 6) {
    if (Math.random() > 0.3) {
      date.setDate(date.getDate() + (day === 0 ? 1 : 2));
    }
  }
  date.setHours(8 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60), Math.floor(Math.random() * 60));
  return date;
}

function randomDateInLastNDays(n: number): Date {
  const now = new Date();
  const daysAgo = Math.floor(Math.random() * n);
  const date = new Date(now);
  date.setDate(date.getDate() - daysAgo);
  date.setHours(8 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60));
  return date;
}

// ============================================================================
// Phase Functions
// ============================================================================

async function phaseDiscover(admin: any) {
  const log: any = {};

  // Find existing org
  const { data: orgs } = await admin.from('organizations').select('id, name, slug').in('slug', ['demo-org', 'demo-corp', 'luminous']);
  log.org = orgs?.[0] || null;

  // Find existing users
  const allEmails = [...EXISTING_ACCOUNTS, ...NEW_EMPLOYEES].map(e => e.email);
  const { data: profiles } = await admin.from('profiles').select('id, full_name, email, org_id, membership_status').in('email', allEmails);
  log.existingUsers = profiles || [];

  // Published courses
  const { data: courses } = await admin.from('courses').select('id, title').eq('status', 'published').order('title');
  log.courses = courses || [];

  // Existing groups
  if (log.org) {
    const { data: groups } = await admin.from('employee_groups').select('id, name, is_dynamic').eq('org_id', log.org.id);
    log.groups = groups || [];
  }

  return log;
}

async function phaseUsers(admin: any) {
  const results: any[] = [];

  // 1. Find or create org
  let orgId: string;
  const { data: existingOrg } = await admin.from('organizations').select('id, slug').in('slug', ['luminous', 'demo-org', 'demo-corp']).limit(1).maybeSingle();

  if (existingOrg) {
    await admin.from('organizations').update({ name: ORG_NAME, slug: ORG_SLUG }).eq('id', existingOrg.id);
    orgId = existingOrg.id;
  } else {
    const { data: newOrg, error } = await admin.from('organizations').insert({ name: ORG_NAME, slug: ORG_SLUG, invite_hash: `luminous-${Date.now()}` }).select('id').single();
    if (error) throw new Error(`Failed to create org: ${error.message}`);
    orgId = newOrg.id;
  }

  // 2. Delete existing custom groups (non-dynamic) to avoid clutter
  await admin.from('employee_groups').delete().eq('org_id', orgId).eq('is_dynamic', false);

  // 3. Process all accounts (existing + new)
  const userMap: Record<string, string> = {};
  const allAccounts = [...EXISTING_ACCOUNTS, ...NEW_EMPLOYEES];

  // Get all auth users to check existence
  const { data: { users: authUsers } } = await admin.auth.admin.listUsers({ perPage: 1000 });

  for (const account of allAccounts) {
    try {
      const existingUser = authUsers?.find((u: any) => u.email === account.email);
      let userId: string;

      if (existingUser) {
        // Update existing user
        await admin.auth.admin.updateUserById(existingUser.id, {
          password: DEMO_PASSWORD,
          user_metadata: { full_name: account.name, role: account.platformRole },
          email_confirm: true,
        });
        userId = existingUser.id;
        results.push({ email: account.email, name: account.name, status: 'updated', id: userId });
      } else {
        // Create new user
        const { data: newUser, error } = await admin.auth.admin.createUser({
          email: account.email,
          password: DEMO_PASSWORD,
          user_metadata: { full_name: account.name, role: account.platformRole },
          email_confirm: true,
        });
        if (error) {
          results.push({ email: account.email, name: account.name, status: 'error', error: error.message });
          continue;
        }
        userId = newUser.user.id;
        results.push({ email: account.email, name: account.name, status: 'created', id: userId });
      }

      userMap[account.email] = userId;

      // Upsert profile
      await admin.from('profiles').upsert({
        id: userId,
        full_name: account.name,
        email: account.email,
        avatar_url: `https://i.pravatar.cc/256?u=${account.email}`,
        role: account.platformRole,
        membership_status: account.membershipStatus,
        org_id: orgId,
        headline: account.headline,
        onboarding_completed_at: new Date().toISOString(),
        billing_disabled: true,
      });
    } catch (err: any) {
      results.push({ email: account.email, name: account.name, status: 'error', error: err.message });
    }
  }

  // 4. Set org owner to demo admin
  const adminUserId = userMap['demo.admin@enhancedhr.ai'];
  if (adminUserId) {
    await admin.from('organizations').update({ owner_id: adminUserId }).eq('id', orgId);
  }

  return { orgId, orgName: ORG_NAME, orgSlug: ORG_SLUG, userMap, results };
}

async function phaseGroups(admin: any, orgId: string, userMap: Record<string, string>) {
  const created: any[] = [];
  const groupMap: Record<string, string> = {};

  // 1. Create groups and add members
  for (const group of GROUP_CONFIG) {
    const { data: newGroup, error } = await admin.from('employee_groups')
      .insert({ org_id: orgId, name: group.name, is_dynamic: false })
      .select('id').single();

    if (error) {
      created.push({ name: group.name, status: 'error', error: error.message });
      continue;
    }

    groupMap[group.name] = newGroup.id;

    // Add members
    const memberInserts = group.members
      .filter(email => userMap[email])
      .map(email => ({ group_id: newGroup.id, user_id: userMap[email] }));

    if (memberInserts.length > 0) {
      await admin.from('employee_group_members').insert(memberInserts);
    }

    created.push({ name: group.name, memberCount: memberInserts.length, id: newGroup.id });
  }

  // 2. Look up courses by title
  const courseTitles = Array.from(new Set(ASSIGNMENT_CONFIG.map(a => a.courseTitle)));
  const courseMap: Record<string, number> = {};

  for (const title of courseTitles) {
    const { data } = await admin.from('courses').select('id, title').eq('status', 'published').ilike('title', title).limit(1).maybeSingle();
    if (data) {
      courseMap[title] = data.id;
    }
  }

  // 3. Create assignments
  const assignments: any[] = [];
  const adminUserId = userMap['demo.admin@enhancedhr.ai'];

  for (const config of ASSIGNMENT_CONFIG) {
    const courseId = courseMap[config.courseTitle];
    if (!courseId) {
      assignments.push({ courseTitle: config.courseTitle, assigneeType: config.assigneeType, assignmentType: config.type, status: 'skipped_no_course' });
      continue;
    }

    let assigneeId: string;
    if (config.assigneeType === 'org') {
      assigneeId = orgId;
    } else if (config.assigneeType === 'group') {
      assigneeId = groupMap[config.groupName!];
      if (!assigneeId) {
        assignments.push({ courseTitle: config.courseTitle, assigneeType: config.assigneeType, assignmentType: config.type, status: 'skipped_no_group' });
        continue;
      }
    } else {
      assigneeId = userMap[config.assigneeEmail!];
      if (!assigneeId) {
        assignments.push({ courseTitle: config.courseTitle, assigneeType: config.assigneeType, assignmentType: config.type, status: 'skipped_no_user' });
        continue;
      }
    }

    const { error } = await admin.from('content_assignments').insert({
      org_id: orgId,
      assignee_type: config.assigneeType,
      assignee_id: assigneeId,
      content_type: 'course',
      content_id: courseId.toString(),
      assignment_type: config.type,
      assigned_by: adminUserId || null,
    });

    assignments.push({
      courseTitle: config.courseTitle,
      assigneeType: config.assigneeType,
      assignmentType: config.type,
      status: error ? 'error' : 'created',
      error: error?.message,
    });
  }

  return { created, assignments, groupMap, courseMap };
}

async function phaseCollections(admin: any, orgId: string, userMap: Record<string, string>, courseMap: Record<string, number>) {
  const adminUserId = userMap['demo.admin@enhancedhr.ai'] || userMap['sarah.chen@luminous.io'];
  const created: any[] = [];

  // Helper to create collection
  async function createOrgCollection(label: string, color: string) {
    // Check if already exists
    const { data: existing } = await admin.from('user_collections')
      .select('id').eq('org_id', orgId).eq('label', label).eq('is_org_collection', true).maybeSingle();

    if (existing) return existing.id;

    const { data, error } = await admin.from('user_collections').insert({
      user_id: adminUserId,
      org_id: orgId,
      label,
      color,
      is_custom: true,
      is_org_collection: true,
    }).select('id').single();

    if (error) throw new Error(`Failed to create collection "${label}": ${error.message}`);
    return data.id;
  }

  // Helper to add context item with embeddings
  async function addContextItem(collectionId: string, title: string, text: string) {
    // Check if already exists
    const { data: existing } = await admin.from('user_context_items')
      .select('id').eq('collection_id', collectionId).eq('title', title).maybeSingle();

    if (existing) return { id: existing.id, embedded: false };

    const { data: item, error } = await admin.from('user_context_items').insert({
      user_id: adminUserId,
      collection_id: collectionId,
      type: 'CUSTOM_CONTEXT',
      title,
      content: { text },
    }).select('id').single();

    if (error) throw new Error(`Failed to create context item "${title}": ${error.message}`);

    // Generate embeddings
    let embedded = false;
    try {
      const fullText = `${title}\n\n${text}`;
      await embedContextItem(adminUserId, item.id, 'CUSTOM_CONTEXT', fullText, collectionId, { title });
      embedded = true;
    } catch (err: any) {
      console.error(`[seed-demo-org] Embedding failed for "${title}":`, err.message);
    }

    return { id: item.id, embedded };
  }

  // Helper to add note to collection
  async function addNoteToCollection(collectionId: string, noteConfig: { title: string; content: string }) {
    const { data: note, error } = await admin.from('notes').insert({
      user_id: adminUserId,
      org_id: orgId,
      title: noteConfig.title,
      content: noteConfig.content,
    }).select('id').single();

    if (error) return null;

    // Link to collection
    await admin.from('collection_items').upsert({
      collection_id: collectionId,
      item_type: 'NOTE',
      item_id: note.id,
      added_at: randomDateInLastNDays(14).toISOString(),
    }, { onConflict: 'collection_id,item_type,item_id' });

    return note.id;
  }

  // Helper to add course to collection
  async function addCourseToCollection(collectionId: string, courseId: number) {
    await admin.from('collection_items').upsert({
      collection_id: collectionId,
      item_type: 'COURSE',
      item_id: courseId.toString(),
      course_id: courseId,
      added_at: randomDateInLastNDays(21).toISOString(),
    }, { onConflict: 'collection_id,item_type,item_id' });
  }

  // === Collection A: Company Knowledge Base ===
  const kbId = await createOrgCollection('Company Knowledge Base', '#3B82F6');
  let kbEmbeddings = 0;

  for (const item of COMPANY_KB_ITEMS) {
    const result = await addContextItem(kbId, item.title, item.text);
    if (result.embedded) kbEmbeddings++;
  }

  await addNoteToCollection(kbId, KB_NOTE);

  const controlSpectrumId = courseMap['The Control Spectrum'];
  if (controlSpectrumId) {
    await addCourseToCollection(kbId, controlSpectrumId);
  }

  created.push({ name: 'Company Knowledge Base', itemCount: COMPANY_KB_ITEMS.length + 2, embeddingsCreated: kbEmbeddings });

  // === Collection B: Manager Development Hub ===
  const mgrId = await createOrgCollection('Manager Development Hub', '#8B5CF6');
  let mgrEmbeddings = 0;

  for (const item of MANAGER_HUB_ITEMS) {
    const result = await addContextItem(mgrId, item.title, item.text);
    if (result.embedded) mgrEmbeddings++;
  }

  await addNoteToCollection(mgrId, MANAGER_NOTE);

  // Add courses to Manager Hub
  const mgrCourses = ['Leadership and Resilience', 'The Five Voices', 'Leadership and Trust - Orient (1 of 4)'];
  for (const title of mgrCourses) {
    const cid = courseMap[title];
    if (cid) await addCourseToCollection(mgrId, cid);
  }

  created.push({ name: 'Manager Development Hub', itemCount: MANAGER_HUB_ITEMS.length + 1 + mgrCourses.length, embeddingsCreated: mgrEmbeddings });

  return { created };
}

async function phaseAnalytics(admin: any, orgId: string, userMap: Record<string, string>, courseMap: Record<string, number>) {
  let progressCount = 0;
  let loginCount = 0;
  let conversationCount = 0;
  let creditCount = 0;

  // Progress config: email → { courseTitles[], completedCount }
  const progressConfig: Record<string, { courses: string[]; completed: number }> = {
    'sarah.chen@luminous.io': { courses: ['The Control Spectrum', 'The Five Voices', 'Leadership and Resilience', 'Objective and Plan'], completed: 2 },
    'marcus.williams@luminous.io': { courses: ['The Control Spectrum', 'The Five Voices', 'Leadership and Resilience', 'Perspective and Identity', 'Engagement During Leadership Transition'], completed: 3 },
    'james.okafor@luminous.io': { courses: ['The Control Spectrum', 'Perspective and Identity', 'The Five Voices', 'Leadership and Resilience', 'Engagement During Leadership Transition', 'Momentum and Alignment'], completed: 4 },
    'demo.admin@enhancedhr.ai': { courses: ['The Control Spectrum', 'The Five Voices', 'Leadership and Resilience'], completed: 2 },
    'priya.sharma@luminous.io': { courses: ['The Control Spectrum', 'Perspective and Identity', 'The Five Voices'], completed: 1 },
    'elena.rodriguez@luminous.io': { courses: ['The Control Spectrum', 'Momentum and Alignment', 'Leadership and Resilience'], completed: 2 },
    'ryan.thompson@luminous.io': { courses: ['The Control Spectrum', 'Momentum and Alignment', 'The Five Voices', 'Leadership and Resilience'], completed: 2 },
    'david.kim@luminous.io': { courses: ['The Control Spectrum', 'The Five Voices'], completed: 1 },
    'aisha.patel@luminous.io': { courses: ['The Control Spectrum', 'Perspective and Identity', 'The Five Voices'], completed: 1 },
    'demo.employee@enhancedhr.ai': { courses: ['The Control Spectrum', 'Momentum and Alignment'], completed: 1 },
    'test@test.com': { courses: ['The Control Spectrum', 'Momentum and Alignment'], completed: 0 },
    'maria.gonzalez@luminous.io': { courses: ['The Control Spectrum', 'The Five Voices'], completed: 0 },
    'nathan.brooks@luminous.io': { courses: ['The Control Spectrum'], completed: 0 },
  };

  // 1. Course Progress
  for (const [email, config] of Object.entries(progressConfig)) {
    const userId = userMap[email];
    if (!userId) continue;

    for (let i = 0; i < config.courses.length; i++) {
      const courseId = courseMap[config.courses[i]];
      if (!courseId) continue;

      const isCompleted = i < config.completed;

      // Get lessons for this course
      const { data: modules } = await admin.from('modules').select('id').eq('course_id', courseId);
      if (!modules || modules.length === 0) continue;

      const moduleIds = modules.map((m: any) => m.id);
      const { data: lessons } = await admin.from('lessons').select('id').in('module_id', moduleIds).limit(20);
      if (!lessons || lessons.length === 0) continue;

      // For completed courses, mark all lessons complete
      // For in-progress, mark a portion
      const lessonsToComplete = isCompleted ? lessons.length : Math.max(1, Math.floor(lessons.length * 0.4));

      for (let j = 0; j < Math.min(lessonsToComplete, lessons.length); j++) {
        const date = randomDateInLast30Days();
        const viewTime = 180 + Math.floor(Math.random() * 420); // 3-10 minutes per lesson

        await admin.from('user_progress').upsert({
          user_id: userId,
          course_id: courseId,
          lesson_id: lessons[j].id,
          is_completed: j < lessonsToComplete,
          last_accessed: date.toISOString(),
          view_time_seconds: viewTime,
        }, { onConflict: 'user_id,lesson_id', ignoreDuplicates: true });

        progressCount++;
      }

      // 2. Credits for completed courses
      if (isCompleted) {
        const certId = `CERT-${userId.slice(0, 8)}-${courseId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const { error: creditError } = await admin.from('user_credits_ledger').insert({
          user_id: userId,
          course_id: courseId,
          credit_type: 'SHRM',
          amount: 1.0 + Math.random() * 1.0, // 1.0-2.0 credits
          certificate_id: certId,
          metadata: { course_title: config.courses[i] },
        });
        if (!creditError) creditCount++;

        // Add HRCI for ~60% of completions
        if (Math.random() < 0.6) {
          const hrciCertId = `CERT-HRCI-${userId.slice(0, 8)}-${courseId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
          const { error: hrciError } = await admin.from('user_credits_ledger').insert({
            user_id: userId,
            course_id: courseId,
            credit_type: 'HRCI',
            amount: 1.0 + Math.random() * 0.5,
            certificate_id: hrciCertId,
            metadata: { course_title: config.courses[i] },
          });
          if (!hrciError) creditCount++;
        }
      }
    }
  }

  // 3. Login Events
  const loginConfig: Record<string, number> = {
    'sarah.chen@luminous.io': 18,
    'marcus.williams@luminous.io': 20,
    'james.okafor@luminous.io': 22,
    'demo.admin@enhancedhr.ai': 15,
    'priya.sharma@luminous.io': 12,
    'elena.rodriguez@luminous.io': 14,
    'ryan.thompson@luminous.io': 16,
    'david.kim@luminous.io': 10,
    'aisha.patel@luminous.io': 13,
    'demo.employee@enhancedhr.ai': 8,
    'test@test.com': 6,
    'maria.gonzalez@luminous.io': 7,
    'nathan.brooks@luminous.io': 4,
  };

  for (const [email, count] of Object.entries(loginConfig)) {
    const userId = userMap[email];
    if (!userId) continue;

    const events = [];
    for (let i = 0; i < count; i++) {
      events.push({
        user_id: userId,
        org_id: orgId,
        created_at: randomDateInLast30Days().toISOString(),
      });
    }

    const { error } = await admin.from('login_events').insert(events);
    if (!error) loginCount += events.length;
  }

  // 4. AI Conversations
  for (const conv of CONVERSATION_TITLES) {
    const userId = userMap[conv.email];
    if (!userId) continue;

    const createdAt = randomDateInLast30Days();
    const updatedAt = new Date(createdAt.getTime() + Math.random() * 3600000); // up to 1 hour later

    const { error } = await admin.from('conversations').insert({
      user_id: userId,
      title: conv.title,
      metadata: {},
      created_at: createdAt.toISOString(),
      updated_at: updatedAt.toISOString(),
    });

    if (!error) conversationCount++;
  }

  return { progressCount, loginCount, conversationCount, creditCount };
}

// ============================================================================
// Main Handler
// ============================================================================

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { secretKey, phase = 'all' } = body;

    // Auth
    if (secretKey !== process.env.COURSE_IMPORT_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: 'Missing Supabase environment variables' }, { status: 500 });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const result: any = {};

    // Phase 0: Discovery
    if (phase === 'discover' || phase === 'all') {
      console.log('[seed-demo-org] Phase 0: Discovery');
      result.discovery = await phaseDiscover(admin);
      if (phase === 'discover') {
        return NextResponse.json({ success: true, ...result });
      }
    }

    // Phase 1: Users
    if (phase === 'users' || phase === 'all') {
      console.log('[seed-demo-org] Phase 1: Users');
      result.users = await phaseUsers(admin);
    }

    const orgId = result.users?.orgId || body.orgId;
    const userMap = result.users?.userMap || body.userMap || {};

    if (!orgId) {
      return NextResponse.json({ error: 'No orgId available. Run users phase first.' }, { status: 400 });
    }

    // Phase 2: Groups + Assignments
    if (phase === 'groups' || phase === 'all') {
      console.log('[seed-demo-org] Phase 2: Groups + Assignments');
      result.groups = await phaseGroups(admin, orgId, userMap);
    }

    const courseMap = result.groups?.courseMap || body.courseMap || {};

    // Phase 3: Collections
    if (phase === 'collections' || phase === 'all') {
      console.log('[seed-demo-org] Phase 3: Collections + Content');
      result.collections = await phaseCollections(admin, orgId, userMap, courseMap);
    }

    // Phase 4: Analytics
    if (phase === 'analytics' || phase === 'all') {
      console.log('[seed-demo-org] Phase 4: Analytics');
      result.analytics = await phaseAnalytics(admin, orgId, userMap, courseMap);
    }

    console.log('[seed-demo-org] Complete');
    return NextResponse.json({ success: true, ...result });

  } catch (error: any) {
    console.error('[seed-demo-org] Fatal error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
