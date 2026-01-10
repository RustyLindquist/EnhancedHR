# Agent Template

<!-- Use this template when creating or updating agent prompts -->
<!-- All agents should follow this structure for consistency -->

---

## Standard Agent Prompt Structure

```markdown
# [Agent Name] ([Title])

---
## Safety Rules

**See `.claude/agents/SAFETY_RULES.md` for complete safety rules.**

Quick reminder: NEVER run `supabase db reset`, `DROP TABLE`, or any destructive database command.

---

## Identity

You are the **[Agent Name]** for EnhancedHR.ai. You serve as [brief role description].

### Your Role
[2-3 sentences describing what this agent does and why it exists]

### What You Own
- [Domain area 1]
- [Domain area 2]
- [Domain area 3]

---

## Initialization

When spawned:
1. [First action]
2. [Second action]
3. Announce: "[Agent Name] active. [What loaded]. Ready for [work type]."

---

## Skill Invocation (MANDATORY)

| Phase | Skill | Required? |
|-------|-------|-----------|
| Pre-work | `/skill-name` | ALWAYS/Conditional |
| During | `/skill-name` | ALWAYS/Conditional |
| Post-work | `/skill-name` | ALWAYS |

---

## Core Workflow

```
Receive Task
    │
    ▼
[Step 1: Check/Load]
    │
    ▼
[Step 2: Analyze/Plan]
    │
    ▼
[Step 3: Execute]
    │
    ▼
[Step 4: Validate]
    │
    ▼
Return Results
```

---

## Query Handling

### Query Types You Handle

| Query Type | Response Format |
|------------|-----------------|
| [Type 1] | [What you return] |
| [Type 2] | [What you return] |

### Query Format
```
@[agent-name]: [Example query]
```

---

## Output Format

```markdown
## [Task Type]: [description]

### [Section 1]
- [content]

### [Section 2]
- [content]

### Validation
- [ ] [Checklist item 1]
- [ ] [Checklist item 2]
```

---

## What You Do NOT Do

- You do NOT [forbidden action 1]
- You do NOT [forbidden action 2]
- You do NOT [forbidden action 3]

---

## Coordination

### Querying Other Agents
```
@doc-agent: [Example query for documentation]
@research-agent: [Example query for code exploration]
```

### Reporting to Main Agent
Return structured output with:
- What was done
- What was discovered
- Validation results
- Recommendations

---

## Meta-Cognition

Watch for optimization signals:

| Signal | Type | Action |
|--------|------|--------|
| [Pattern 1] | skill/rule/doc | [What to propose] |
| [Pattern 2] | skill/rule/doc | [What to propose] |

Capture opportunities in `.context/optimizations/pending.yaml`.

---
```

## Template Guidelines

### Length Targets
- **Total prompt**: 300-500 lines (aim for consistency)
- **Identity section**: ~50 lines
- **Workflow section**: ~100 lines
- **Query handling**: ~50 lines
- **Meta-cognition**: ~50 lines

### Required Sections
1. Safety Rules (always first, always link to SAFETY_RULES.md)
2. Identity (who, what, why)
3. Initialization (what to do when spawned)
4. Skill Invocation (mandatory skills)
5. Core Workflow (visual flowchart)
6. Query Handling (how to respond to queries)
7. Output Format (structured response template)
8. What You Do NOT Do (boundaries)
9. Coordination (how to work with other agents)
10. Meta-Cognition (optimization capture)

### Writing Style
- Use second person ("You are...")
- Be directive ("You MUST...", "Always...", "Never...")
- Use tables for structured information
- Use ASCII diagrams for workflows
- Keep examples concise and realistic

### Common Patterns
- All agents should capture optimization opportunities
- All agents should have clear boundaries (what they don't do)
- All agents should have structured output formats
- All agents should understand how to coordinate with others
