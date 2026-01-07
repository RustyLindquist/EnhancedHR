# Spawn Research Agent

<!-- Version: 1.0.0 | Last Updated: 2026-01-07 -->

> **Cost**: ~4× token usage for single agent spawn. Research Agent is context-efficient (returns summaries, not raw content).

Spawn the Research Agent (Codebase Explorer) to answer questions about the codebase through efficient exploration and analysis.

## When to Use

Use this command for **codebase exploration and understanding**:
- "Where is X implemented?"
- "How does Y work?"
- "What files are involved in Z?"
- "Trace the call chain from A to B"
- "Find all places that use X"
- "Show me the architecture of feature Y"
- "What are all the server actions related to X?"
- Pre-implementation research (understanding existing code before building)

## When NOT to Use

Skip the Research Agent when:
- You need to modify code (that's for implementing agents)
- You need documentation (that's for Doc Agent)
- You need testing (that's for Test Agent)
- You already know exactly where the code is and just need to read it
- The question is about product features, not code (ask Doc Agent)

### Examples: Use Research Agent

| Query | Why Research Agent |
|-------|-------------------|
| "Where is the bookmark feature implemented?" | Needs to search and map the codebase |
| "How does course progress tracking work?" | Needs to trace code flow |
| "Find all server actions that modify collections" | Needs comprehensive search |
| "What files are involved in the enrollment flow?" | Needs to map related files |
| "Trace how a course completion updates credits" | Needs to follow data flow |

### Examples: Use Different Agent

| Query | Use Instead | Why |
|-------|-------------|-----|
| "What are the invariants for collections?" | Doc Agent | About feature requirements, not code |
| "Fix the bookmark button" | Frontend Agent | Needs modification, not exploration |
| "Test the enrollment flow" | Test Agent | Needs validation, not exploration |
| "What is the user workflow for X?" | Doc Agent | About user behavior, not code |

## What Happens

1. Research Agent spawns and:
   - Loads FEATURE_INDEX.md to understand feature landscape
   - Parses the research query
   - Plans an efficient search strategy

2. For each query, the agent:
   - Uses Glob to find relevant files by pattern
   - Uses Grep to search file contents
   - Uses Read to understand specific implementations
   - Maps relationships and data flows
   - Synthesizes findings into concise summaries

3. Returns structured output with:
   - Concise answer to the question
   - Key files with their purposes
   - Code flows or call chains (if applicable)
   - Related features and coupling notes
   - Helpful observations and caveats

## How to Delegate Research

```
@research-agent: Where is the addToCollection action implemented?

@research-agent: How does course progress tracking work?

@research-agent: What files are involved in the Prometheus chat feature?

@research-agent: Find all places that use createAdminClient()

@research-agent: Trace the enrollment flow from button click to database write
```

## Research Agent Capabilities

The agent specializes in:

| Capability | What It Does |
|------------|-------------|
| **Pattern Search** | Find files matching patterns across the codebase |
| **Content Search** | Search for specific code, functions, types, or text |
| **Code Reading** | Read and understand implementations strategically |
| **Architecture Mapping** | Trace data flows, call chains, and dependencies |
| **Summary Generation** | Synthesize findings into actionable summaries |

## Search Strategies

The agent uses progressive refinement:

1. **Broad search** — Find all potentially relevant files
2. **Narrow search** — Filter to the most relevant files
3. **Deep dive** — Read specific implementations
4. **Synthesize** — Connect the dots and map relationships

The agent optimizes for **context efficiency** — it returns summaries and insights, not raw file contents.

## Expected Output Format

```
## Research Summary: [query]

### Answer
[Concise answer to the question]

### Key Files
- `absolute/path/to/file.ts` - [purpose/role]
- `absolute/path/to/other.tsx` - [purpose/role]

### Code Flow (if applicable)
1. Entry point: path → function
2. Calls: path → function
3. Data: path → database operation
4. Final: path → return/render

### Related Features
- [feature-name] - [how it's related]

### Notes
- [observations, patterns, caveats]
```

## Context Efficiency

The Research Agent is optimized for token efficiency:
- Loads docs lazily (only what's needed)
- Returns summaries, not raw content
- Uses parallel searches when possible
- Reads files strategically, not exhaustively

This makes it perfect for long sessions where you need to understand multiple parts of the codebase without filling up context.

## Coordination with Other Agents

### Works Well With Doc Agent
```
Main Agent → Research Agent: "Where is X implemented?"
Research Agent → Doc Agent: "What features are related to X?"
Research Agent → Main Agent: "Here's what I found..."
```

### Feeds into Implementing Agents
```
Main Agent → Research Agent: "How does enrollment work?"
Research Agent → Main Agent: [detailed findings]
Main Agent → Backend Agent: "Modify enrollment to add Y"
```

## Read-Only Guarantee

The Research Agent:
- **NEVER modifies code**
- **NEVER creates or edits files**
- **NEVER runs builds, tests, or servers**

It only explores, understands, and explains.

## Common Research Patterns

| Pattern | Example Query | Approach |
|---------|--------------|----------|
| Feature Location | "Where is bookmarks implemented?" | Grep for terms, map files by role |
| Implementation Details | "How does watch time tracking work?" | Find entry point, trace flow, explain |
| Dependency Mapping | "What depends on the collections table?" | Grep for table name, categorize usage |
| Call Chain Tracing | "Trace course completion to certificate generation" | Follow the chain step by step |
| Pattern Discovery | "Find all server actions using admin client" | Search for pattern, document usage |

## Full Specification

See `.claude/agents/research-agent.md` for the complete agent prompt.
