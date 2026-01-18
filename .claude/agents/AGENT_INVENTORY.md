# Agent Inventory

<!-- Version: 1.0.0 | Last Updated: 2026-01-11 -->

Comprehensive registry of all agents, their capabilities, costs, and selection criteria.

---

## Quick Selection Matrix

| Need | Primary Agent | Model | Cost | Spawn Command |
|------|---------------|-------|------|---------------|
| UI/Components | Frontend Agent | sonnet | ~4x | `/spawn-frontend-agent` |
| Server/API/DB | Backend Agent | opus | ~4x | `/spawn-backend-agent` |
| Code exploration | Research Agent | haiku | ~4x | `/spawn-research-agent` |
| Testing | Test Agent | sonnet | ~4x | `/spawn-test-agent` |
| Documentation | Doc Agent | inherit | ~4x | `/spawn-doc-agent` |
| System optimization | Ops Agent | inherit | ~4x | `/spawn-ops-agent` |
| Architecture | Architect Agent | opus | ~4x | `/spawn-architect-agent` |
| Security review | Security Agent | opus | ~4x | `/spawn-security-agent` |
| Git/Push/Merge | Git Ops Agent | sonnet | ~4x | `/push` |
| Session analysis | Workflow Analysis | opus | ~4x | `/analyze` |

---

## Agent Profiles

### Frontend Agent (Design System Guardian)

**File**: `.claude/agents/frontend-agent.md`

**Model**: `sonnet` (balanced quality/cost for UI work)

**Capabilities**:
- Component creation and modification
- Styling with Tailwind CSS
- Responsive design implementation
- Accessibility compliance (ARIA, keyboard nav)
- Animation and transitions
- Form handling and validation

**Required Skills** (must invoke):
- `/frontend/component-inventory` — Before creating new components
- `/frontend/style-discovery` — Before adding new styles

**Best For**:
- React component work
- UI/UX improvements
- Styling changes
- Client-side interactivity

**Not For**:
- API endpoints
- Database operations
- Server actions

**Output Includes**:
- Files modified
- Visual verification steps
- Accessibility checklist

---

### Backend Agent (API Guardian)

**File**: `.claude/agents/backend-agent.md`

**Model**: `opus` (critical for data integrity)

**Capabilities**:
- Server actions (Next.js)
- API route creation
- Database operations (Supabase)
- RLS policy management
- External service integration
- Data validation

**Required Skills** (must invoke):
- Read RLS policies before data operations
- Document any `createAdminClient()` usage

**Best For**:
- Server-side logic
- Database queries/mutations
- Authentication flows
- API integrations (Stripe, Mux, Resend)

**Not For**:
- React components
- Client-side styling
- UI interactions

**Output Includes**:
- API contract changes
- RLS policy verification
- Migration steps (if applicable)

---

### Research Agent (Codebase Explorer)

**File**: `.claude/agents/research-agent.md`

**Model**: `haiku` (fast, cost-effective for exploration)

**Capabilities**:
- Codebase exploration
- Pattern identification
- Dependency tracing
- Impact analysis
- Question answering

**Best For**:
- "How does X work?"
- "Where is Y implemented?"
- Pre-implementation research
- Understanding existing patterns

**Not For**:
- Code modifications
- Implementation work
- Testing

**Output Includes**:
- Key files with line numbers
- Data flow diagrams
- Pattern summary
- Recommendations

---

### Test Agent (Quality Guardian)

**File**: `.claude/agents/test-agent.md`

**Model**: `sonnet` (balanced for test reasoning)

**Capabilities**:
- Unit test creation
- Integration test creation
- E2E test scenarios
- Test execution and debugging
- Coverage analysis

**Best For**:
- Writing tests
- Debugging test failures
- Improving coverage
- Test infrastructure

**Not For**:
- Implementation code
- Documentation
- Architecture decisions

**Output Includes**:
- Test files created/modified
- Test execution results
- Coverage changes

---

### Doc Agent (Living Canon)

**File**: `.claude/agents/doc-agent.md`

**Model**: `inherit` (uses orchestrator's model)

**Capabilities**:
- Documentation lookup
- Feature doc maintenance
- Invariant tracking
- Workflow documentation
- Index management

**Query Patterns**:
```
@doc-agent: What invariants apply to [feature]?
@doc-agent: What files implement [feature]?
@doc-agent: What are the coupling points for [feature]?
```

**Best For**:
- Documentation questions
- Invariant lookup
- Feature scope understanding
- Documentation updates

**Not For**:
- Code implementation
- Testing
- Security auditing

**Output Includes**:
- Relevant documentation excerpts
- Related features
- Invariants checklist

---

### Ops Agent (System Optimizer)

**File**: `.claude/agents/ops-agent.md`

**Model**: `inherit` (uses orchestrator's model)

**Capabilities**:
- Optimization implementation
- Performance improvements
- Cost reduction
- Process improvements
- Hook/script creation

**Input Source**: `.context/optimizations/pending.yaml`

**Best For**:
- Implementing captured optimizations
- Performance tuning
- Build/CI improvements
- Developer experience

**Not For**:
- Feature implementation
- Security review
- Architecture decisions

**Output Includes**:
- Changes implemented
- Performance metrics (before/after)
- Documentation updates

---

### Architect Agent (System Designer)

**File**: `.claude/agents/architect-agent.md`

**Model**: `opus` (highest capability for design)

**Capabilities**:
- System design decisions
- Technology selection
- Integration patterns
- Refactoring strategies
- Technical debt assessment

**When to Spawn**:
- New system/feature design
- Major refactoring
- Technology evaluation
- Integration planning

**Best For**:
- "How should we structure X?"
- Cross-system decisions
- Technical tradeoffs
- Migration planning

**Not For**:
- Direct implementation
- Bug fixes
- Routine changes

**Output Includes**:
- Design document
- Decision rationale
- Implementation guidance
- Risk assessment

---

### Security Agent (Security Auditor)

**File**: `.claude/agents/security-agent.md`

**Model**: `opus` (critical for security analysis)

**Capabilities**:
- Vulnerability detection
- RLS policy auditing
- Authentication review
- Input validation checking
- OWASP Top 10 analysis

**OWASP Checks**:
- A01: Broken Access Control
- A02: Cryptographic Failures
- A03: Injection
- A07: Auth Failures

**Best For**:
- Security audits
- Pre-deployment review
- RLS verification
- Auth flow analysis

**Not For**:
- Feature implementation
- UI work
- Performance optimization

**Output Includes**:
- Vulnerabilities found (severity rated)
- RLS audit results
- Remediation steps
- Verification checklist

---

### Git Ops Agent (Push Specialist)

**File**: `.claude/agents/git-ops-agent.md`

**Model**: `sonnet` (balanced for git operations)

**Capabilities**:
- Git commit, push, PR, merge operations
- Package manager detection (npm/pnpm/yarn)
- Build validation before commits
- File categorization (feature/local/test)
- Merge conflict resolution (simple cases)
- Lockfile management

**Quick Skill**: `/push "description"`

**Best For**:
- Pushing changes when context is low
- Atomic commit-push-merge workflow
- End-of-session commits
- Consistent git operations

**Not For**:
- Fixing code or build errors
- Editing source files
- Architecture decisions
- Documentation updates

**Escalates When**:
- Build fails requiring code changes
- Complex merge conflicts in business logic
- Unclear file inclusion decisions
- Security concerns in staged files

**Output Includes**:
- PR URL
- Files committed/excluded
- Verification checklist
- Final git status

---

### Workflow Analysis Agent (Process Optimizer)

**File**: `.claude/agents/workflow-analysis-agent.md`

**Model**: `opus` (deep analysis required)

**Capabilities**:
- Session performance analysis
- Process improvement identification
- Friction point detection
- Improvement implementation

**Trigger**: `/analyze` command at session end

**Best For**:
- End-of-session analysis
- Process improvements
- Workflow optimization
- Continuous improvement

**Not For**:
- Implementation work
- Bug fixes
- Feature development

**Output Includes**:
- Performance ratings
- Friction points
- Improvement plan
- Session documentation

---

## Model Selection Guide

| Model | Use When | Cost | Capability |
|-------|----------|------|------------|
| **opus** | Critical decisions, security, architecture, data integrity | Highest | Maximum |
| **sonnet** | Implementation work, testing, balanced tasks | Medium | High |
| **haiku** | Exploration, simple queries, cost-sensitive | Lowest | Good |
| **inherit** | Follow orchestrator's model setting | Varies | Varies |

### Model Recommendations by Task

```
Security review      → opus (non-negotiable)
Architecture design  → opus (critical thinking)
Backend/DB changes   → opus (data integrity)
Session analysis     → opus (deep analysis)
Frontend UI work     → sonnet (balanced)
Test creation        → sonnet (reasoning needed)
Code exploration     → haiku (cost effective)
Simple queries       → haiku (fast, cheap)
Doc lookup           → inherit (follow context)
Ops tasks            → inherit (varies by task)
```

---

## Parallel Agent Patterns

### Safe Parallel Combinations

| Pattern | Agents | Use Case |
|---------|--------|----------|
| Research + Doc | research-agent, doc-agent | Understanding before implementation |
| Frontend + Backend | frontend-agent, backend-agent | Full-stack feature (disjoint files) |
| Test + Doc | test-agent, doc-agent | Post-implementation verification |

### Unsafe Parallel (Avoid)

| Pattern | Risk |
|---------|------|
| Two frontend agents | File conflicts |
| Two backend agents | Database race conditions |
| Any agent + same-domain agent | Merge conflicts |

### Parallel Dispatch Skill

Use `/parallel-dispatch` for coordinated parallel execution with dependency checking.

---

## Agent Communication Patterns

### Query Pattern (Information Request)

```
@doc-agent: What invariants apply to user authentication?
```

Agent returns information; orchestrator uses it for decisions.

### Delegation Pattern (Work Assignment)

```
/spawn-frontend-agent "Implement dark mode toggle in header"
```

Agent performs work and returns results.

### Coordination Pattern (Multi-Agent)

```
Wave 1: /spawn-research-agent "Understand current auth flow"
Wave 2: /spawn-backend-agent "Implement new auth endpoint"
        /spawn-frontend-agent "Create login form" (parallel)
Wave 3: /spawn-test-agent "Test complete auth flow"
```

---

## Decision Tree: Which Agent?

```
Is this a question about existing code?
├─ Yes → Research Agent (haiku)
└─ No ↓

Is this a documentation question?
├─ Yes → Doc Agent (inherit)
└─ No ↓

Does this involve security concerns?
├─ Yes → Security Agent (opus)
└─ No ↓

Is this an architecture/design decision?
├─ Yes → Architect Agent (opus)
└─ No ↓

Does this involve database/API/server?
├─ Yes → Backend Agent (opus)
└─ No ↓

Does this involve UI/components/styling?
├─ Yes → Frontend Agent (sonnet)
└─ No ↓

Is this about testing?
├─ Yes → Test Agent (sonnet)
└─ No ↓

Is this about git/push/merge (especially when context is low)?
├─ Yes → /push (Git Ops Agent)
└─ No ↓

Is this about optimization/process?
├─ Yes → Ops Agent (inherit)
└─ No ↓

Is this end-of-session analysis?
├─ Yes → /analyze (Workflow Analysis)
└─ No → Handle inline or clarify
```

---

## Cost Optimization

### Cost Tiers

| Tier | Model | Relative Cost | Use For |
|------|-------|---------------|---------|
| 1 | haiku | 1x | Exploration, simple queries |
| 2 | inherit | 1-4x | Follows context |
| 3 | sonnet | 2x | Implementation |
| 4 | opus | 4x | Critical decisions |

### Cost-Saving Strategies

1. **Use Research Agent First**: Haiku model for exploration before spawning opus agents
2. **Batch Related Work**: One agent call for multiple related tasks
3. **Use Inherit When Possible**: Doc and Ops agents inherit orchestrator model
4. **Avoid Unnecessary Spawns**: Simple fixes don't need full agent context
5. **Parallel When Appropriate**: One round-trip for multiple agents vs sequential

---

## Related Files

- `.claude/agents/AGENT_PROTOCOL.md` — Coordination rules
- `.claude/agents/SAFETY_RULES.md` — Safety constraints
- `.claude/skills/task-router/SKILL.md` — Automatic routing
- `.claude/skills/infer-intent/SKILL.md` — Intent analysis
- `.claude/skills/parallel-dispatch/SKILL.md` — Parallel execution
