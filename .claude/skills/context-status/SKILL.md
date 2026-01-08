---
name: context-status
description: Check current context window usage and get recommendations. Use when sessions feel slow, responses seem degraded, or before starting complex work.
allowed-tools: Read
---

# Context Status Skill

## Purpose
Monitor context window health and get actionable recommendations. Context saturation causes degraded performance, forgotten instructions, and tool neglect.

## When to Use
- Session feels "slow" or responses seem less sharp
- Before starting a complex multi-step task
- After loading multiple large files
- When you notice instructions being forgotten
- Periodically during long sessions (every 30-60 minutes)

## Context Health Indicators

### Symptoms of Context Saturation

| Symptom | Severity | Likely Cause |
|---------|----------|--------------|
| Forgetting earlier instructions | 🟠 High | Instructions pushed out of active attention |
| Not using tools mentioned earlier | 🟠 High | Tool awareness faded |
| Repeating work already done | 🟡 Medium | Lost track of completed tasks |
| Asking questions already answered | 🟡 Medium | Previous context not retained |
| Simplified responses | 🟡 Medium | Less processing capacity available |
| Missing details in analysis | 🔴 Critical | Significant capacity reduction |

### Context Load Estimation

Without direct access to token counts, estimate by tracking:

```
Context Contributors:
├── System prompt + instructions (~10-15%)
├── CLAUDE.md + loaded docs (~10-30%)
├── Conversation history (variable)
├── Active file contents (variable)
├── Agent outputs (variable)
└── Working memory (variable)
```

## Status Check Process

### Step 1: Assess Current State

Ask yourself:
1. How long has this session been running?
2. How many files have been loaded?
3. How many agents have been spawned?
4. How much conversation history exists?
5. Are responses as detailed as session start?

### Step 2: Estimate Context Level

| Indicator | Context Level |
|-----------|---------------|
| Session < 15 min, few files | 🟢 Low (< 30%) |
| Session 15-45 min, moderate files | 🟡 Medium (30-60%) |
| Session 45-90 min, many files | 🟠 High (60-80%) |
| Session > 90 min, heavy file loading | 🔴 Critical (> 80%) |

### Step 3: Check Instruction Retention

Quick self-test:
- [ ] Can recall the safety rules (supabase db reset forbidden)?
- [ ] Can recall available tools (Supabase CLI, Chrome extension)?
- [ ] Can recall agent spawn criteria?
- [ ] Remember current task objective?

If any are unclear → context is likely saturated.

## Output Format

```markdown
## Context Status Report

**Session Duration**: [estimate]
**Estimated Context Level**: [🟢 Low / 🟡 Medium / 🟠 High / 🔴 Critical]

### Current Load

| Category | Items | Estimated Impact |
|----------|-------|------------------|
| Loaded docs | [count] | [low/medium/high] |
| Conversation turns | [count] | [low/medium/high] |
| Active files | [count] | [low/medium/high] |
| Spawned agents | [count] | [low/medium/high] |

### Retention Check
- [ ] Safety rules: [✓ clear / ⚠️ fuzzy]
- [ ] Tool awareness: [✓ clear / ⚠️ fuzzy]
- [ ] Task objective: [✓ clear / ⚠️ fuzzy]
- [ ] Recent decisions: [✓ clear / ⚠️ fuzzy]

### Recommendations

**Immediate Actions:**
1. [Action based on status]
2. [Action based on status]

**Preventive Actions:**
1. [Action to avoid further saturation]

### Suggested Next Step
[/compact | /checkpoint | continue normally | spawn subagent]
```

## Recommendations by Level

### 🟢 Low Context (< 30%)
```
Status: Healthy
Action: Continue normally
Tips:
- Good time for complex tasks
- Can load additional docs if needed
- Full orchestration capabilities available
```

### 🟡 Medium Context (30-60%)
```
Status: Adequate
Action: Monitor and be efficient
Tips:
- Prefer subagent delegation over direct work
- Avoid loading unnecessary files
- Consider /checkpoint if doing important work
- Return summaries, not raw content
```

### 🟠 High Context (60-80%)
```
Status: Caution
Action: Reduce load, delegate more
Tips:
- STRONGLY prefer subagent delegation
- Run /checkpoint to save state
- Unload docs that are no longer needed
- Keep responses focused and concise
- Consider /compact if continuing much longer
```

### 🔴 Critical Context (> 80%)
```
Status: Degraded
Action: Compact immediately
Tips:
- Run /compact NOW before losing important context
- Critical instructions may be fading
- Subagent spawning may be impaired
- Consider ending session after current task
```

## Context Preservation Strategies

### Delegation Pattern
```
Instead of: Load file → Analyze → Respond with full analysis
Do: Spawn research-agent → Receive summary → Respond with summary

Benefit: Subagent uses separate context, returns condensed output
```

### Lazy Loading Pattern
```
Instead of: Load all possibly-relevant docs upfront
Do: Query Doc Agent for specific answers as needed

Benefit: Doc Agent loads docs in its context, returns answers
```

### Progressive Disclosure Pattern
```
Instead of: Return complete file contents
Do: Return structure + key excerpts + file path for reference

Benefit: Details available on request, not consuming context
```

### Checkpoint Pattern
```
Every major milestone:
1. Run /checkpoint
2. Capture current state
3. Can recover if context degrades
```

## Integration with Other Skills

| If Context Level... | Skill Action |
|---------------------|--------------|
| 🟢 Low | Continue with any skill |
| 🟡 Medium | Run /checkpoint before complex work |
| 🟠 High | Consider /compact, delegate to agents |
| 🔴 Critical | Run /compact immediately |

## Quick Check (Inline)

For a fast assessment without full report:

```
Quick Context Check:
- Session time: [short/medium/long]
- Response quality: [sharp/adequate/degraded]
- Instruction retention: [clear/fuzzy]
→ Recommendation: [continue/monitor/checkpoint/compact]
```

## Warning Signs to Watch For

During any session, watch for these degradation signals:

1. **Tool Forgetting**: Not using Supabase CLI or Chrome extension when appropriate
2. **Agent Neglect**: Doing work directly instead of delegating
3. **Instruction Drift**: Missing safety rules or process steps
4. **Repetition**: Asking about things already discussed
5. **Simplification**: Providing less detailed analysis than earlier

If ANY of these appear → run `/context-status` immediately.
