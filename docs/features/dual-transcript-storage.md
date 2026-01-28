---
id: dual-transcript-storage
owner: platform-engineering
status: active
stability: stable
last_updated: 2026-01-28
surfaces:
  routes:
    - /admin/courses/:id/builder
    - /author/courses/:id/builder
data:
  tables:
    - public.lessons
  columns:
    - ai_transcript (TEXT)
    - user_transcript (TEXT)
    - transcript_source (TEXT)
    - transcript_status (TEXT)
    - transcript_generated_at (TIMESTAMPTZ)
backend:
  actions:
    - src/lib/lesson-transcript.ts
  migrations:
    - supabase/migrations/20260127120000_add_dual_transcripts.sql
invariants:
  - User transcript ALWAYS takes priority over AI transcript
  - transcript_source must be one of: none, ai, user, mux-caption, whisper, youtube, legacy
  - transcript_status must be one of: pending, generating, ready, failed
  - Legacy content column is preserved for backward compatibility
---

# Dual Transcript Storage

## Overview

The dual transcript storage system allows lessons to store both AI-generated and user-entered transcripts. When both are present, the user transcript takes priority. This enables automatic transcription while allowing users to override with custom content.

## Database Schema

### Migration: `20260127120000_add_dual_transcripts.sql`

```sql
ALTER TABLE lessons
ADD COLUMN IF NOT EXISTS ai_transcript TEXT,
ADD COLUMN IF NOT EXISTS user_transcript TEXT,
ADD COLUMN IF NOT EXISTS transcript_source TEXT DEFAULT 'none',
ADD COLUMN IF NOT EXISTS transcript_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS transcript_generated_at TIMESTAMPTZ;
```

### Column Definitions

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `ai_transcript` | TEXT | null | AI-generated transcript from Mux captions, Whisper, or YouTube |
| `user_transcript` | TEXT | null | User-entered transcript override (takes priority) |
| `transcript_source` | TEXT | 'none' | Source of the current active transcript |
| `transcript_status` | TEXT | 'pending' | Status of transcript generation |
| `transcript_generated_at` | TIMESTAMPTZ | null | Timestamp of last transcript generation |

### Constraints

```sql
-- Valid transcript_source values
CHECK (transcript_source IN ('none', 'ai', 'user', 'mux-caption', 'whisper', 'youtube', 'legacy'))

-- Valid transcript_status values
CHECK (transcript_status IN ('pending', 'generating', 'ready', 'failed'))
```

### Indexes

```sql
-- For finding lessons that need transcript generation
CREATE INDEX idx_lessons_transcript_status
ON lessons(transcript_status)
WHERE transcript_status IN ('pending', 'generating', 'failed');

-- For finding lessons with user overrides
CREATE INDEX idx_lessons_user_transcript
ON lessons(id)
WHERE user_transcript IS NOT NULL AND user_transcript != '';
```

## Transcript Resolution Logic

### `/src/lib/lesson-transcript.ts`

```typescript
export function resolveTranscript(lesson: {
    ai_transcript?: string | null;
    user_transcript?: string | null;
    content?: string | null;
}): { content: string | null; source: TranscriptSource } {
    // 1. User transcript takes priority
    if (lesson.user_transcript?.trim()) {
        return { content: lesson.user_transcript, source: 'user' };
    }

    // 2. AI transcript is second priority
    if (lesson.ai_transcript?.trim()) {
        return { content: lesson.ai_transcript, source: 'ai' };
    }

    // 3. Legacy content field for backward compatibility
    if (lesson.content?.trim()) {
        return { content: lesson.content, source: 'legacy' };
    }

    // 4. No transcript available
    return { content: null, source: 'none' };
}
```

### Priority Order

1. **User transcript** (`user_transcript`) - Highest priority, user override
2. **AI transcript** (`ai_transcript`) - Generated content
3. **Legacy content** (`content`) - Pre-migration content for backward compatibility
4. **None** - No transcript available

## Transcript Sources

| Source | Description | How Set |
|--------|-------------|---------|
| `none` | No transcript | Default state |
| `ai` | Generic AI-generated | Fallback for unknown AI source |
| `user` | User manually entered | User saves in "Manual Entry" tab |
| `mux-caption` | Mux auto-generated captions | Primary for Mux videos |
| `whisper` | OpenAI Whisper transcription | Fallback for Mux videos |
| `youtube` | YouTube captions | YouTube videos |
| `legacy` | Pre-migration content | Existing lessons before dual transcript |

## Transcript Status

| Status | Description | UI Indicator |
|--------|-------------|--------------|
| `pending` | Awaiting generation | Gray badge |
| `generating` | Generation in progress | Purple spinner |
| `ready` | Transcript available | Green checkmark |
| `failed` | Generation failed | Red warning |

## Data Migration

The migration automatically converts existing content:

```sql
UPDATE lessons
SET
    ai_transcript = content,
    transcript_source = 'legacy',
    transcript_status = CASE
        WHEN content IS NOT NULL AND content != '' THEN 'ready'
        ELSE 'pending'
    END,
    transcript_generated_at = CASE
        WHEN content IS NOT NULL AND content != '' THEN created_at
        ELSE NULL
    END
WHERE ai_transcript IS NULL
  AND content IS NOT NULL
  AND content != '';
```

## Usage Examples

### Saving AI Transcript

```typescript
await supabase
    .from('lessons')
    .update({
        ai_transcript: transcriptContent,
        transcript_source: 'mux-caption',
        transcript_status: 'ready',
        transcript_generated_at: new Date().toISOString(),
    })
    .eq('id', lessonId);
```

### Saving User Transcript

```typescript
await supabase
    .from('lessons')
    .update({
        user_transcript: userContent,
        transcript_source: 'user',
        // Status and timestamp remain from AI generation
    })
    .eq('id', lessonId);
```

### Clearing User Override

```typescript
await supabase
    .from('lessons')
    .update({
        user_transcript: null,
        transcript_source: lesson.ai_transcript ? 'ai' : 'none',
    })
    .eq('id', lessonId);
```

## Testing Checklist

- [ ] Create lesson with video; verify AI transcript saves to `ai_transcript`
- [ ] Add manual transcript; verify saves to `user_transcript`
- [ ] Verify manual transcript displays over AI transcript
- [ ] Clear manual transcript; verify AI transcript displays
- [ ] Check existing lessons show 'legacy' source
- [ ] Verify transcript_status updates correctly during generation

## Related Docs

- `docs/features/video-transcript-generation.md` - Generation pipeline
- `docs/features/lesson-editor-transcripts.md` - UI components
