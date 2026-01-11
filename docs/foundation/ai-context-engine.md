# AI Context Engine — Foundation Doc

## Overview

This document covers the cross-cutting concerns of AI functionality in EnhancedHR.ai, including context assembly, embeddings, and prompt patterns.

## Architecture

```
User Query
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│                   AI CONTEXT ENGINE                          │
│                                                              │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐       │
│  │  Context    │   │  Vector     │   │  Prompt     │       │
│  │  Assembly   │   │  Search     │   │  Templates  │       │
│  └─────────────┘   └─────────────┘   └─────────────┘       │
│                                                              │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐       │
│  │  Embedding  │   │  Token      │   │  Response   │       │
│  │  Generation │   │  Management │   │  Streaming  │       │
│  └─────────────┘   └─────────────┘   └─────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

## Security Invariants

1. **Organization Scoping**: AI context MUST be scoped to the user's organization
2. **Input Sanitization**: All user input MUST be sanitized before embedding
3. **Permission Verification**: Verify user has access to context sources
4. **Audit Logging**: Log AI interactions for compliance and debugging
5. **Token Limits**: Respect token limits for cost control

## Context Assembly

### Sources

| Source | Priority | Description |
|--------|----------|-------------|
| User Query | 1 | Current question/request |
| Course Content | 2 | Relevant lesson content |
| User Notes | 3 | User's personal notes |
| Conversation History | 4 | Previous messages in session |
| Knowledge Base | 5 | Platform-wide knowledge |

### Assembly Order

1. Extract user intent from query
2. Search vector store for relevant content
3. Filter by user permissions and org scope
4. Rank by relevance
5. Assemble within token budget
6. Add system prompt and instructions

## Embedding Strategy

### What Gets Embedded

- Course content (lessons, descriptions)
- User notes
- Knowledge base articles
- Conversation summaries (not raw messages)

### Embedding Model

- Model: [configured in environment]
- Dimensions: [configured in environment]
- Batch size: Handle in batches to avoid rate limits

### Re-embedding Triggers

- Content updated
- Embedding model changed
- Manual refresh requested

## Prompt Patterns

### System Prompt Structure

```
[Role definition]
[Context boundaries]
[Response format instructions]
[Safety guidelines]
[Available context]
```

### User Message Format

```
[Sanitized user query]
[Relevant context snippets]
[Any special instructions]
```

## Tables Involved

| Table | Purpose |
|-------|---------|
| `embeddings` | Vector storage for content |
| `conversations` | Chat session tracking |
| `conversation_messages` | Individual messages |
| `ai_usage` | Token usage tracking |

## RLS Considerations

- Embeddings filtered by org_id
- Conversations owned by user
- Cross-org context access blocked
- Admin client required only for platform-wide knowledge

## Integration Points

| Feature | Integration |
|---------|-------------|
| Course Player | Provides course context |
| Collections | User's saved content |
| Prometheus Chat | Primary AI interface |
| Notes | User's annotations |

## Performance Considerations

- Cache frequent vector searches
- Stream responses for better UX
- Batch embedding operations
- Monitor token usage for cost

## Error Handling

| Error | Response |
|-------|----------|
| Rate limit | Retry with backoff |
| Token exceeded | Truncate context, inform user |
| Embedding failure | Queue for retry, use fallback |
| Permission denied | Return generic error, log details |

## Testing Checklist

- [ ] Context respects org boundaries
- [ ] Sanitization blocks injection attempts
- [ ] Token limits enforced
- [ ] Streaming works correctly
- [ ] Error messages are safe (no internal details)

## Related Docs

- `docs/features/prometheus-chat.md` — Chat interface
- `docs/features/ai-context-engine.md` — Feature-level documentation
- `docs/foundation/auth-roles-rls.md` — Permission model
