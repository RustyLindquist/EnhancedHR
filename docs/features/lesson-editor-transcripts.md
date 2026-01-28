---
id: lesson-editor-transcripts
owner: platform-engineering
status: active
stability: stable
last_updated: 2026-01-28
surfaces:
  routes:
    - /admin/courses/:id/builder (Admin Course Builder)
    - /author/courses/:id/builder (Expert Course Builder)
  components:
    - LessonEditorPanel.tsx
    - ExpertLessonEditorPanel.tsx
    - TranscriptRequiredModal.tsx
data:
  tables:
    - public.lessons (ai_transcript, user_transcript, transcript_source, transcript_status)
backend:
  actions:
    - src/app/actions/course-builder.ts (generateTranscriptFromVideo)
invariants:
  - "Upload" MUST be the default/first video source option
  - AI transcript tab MUST be read-only
  - Manual Entry tab MUST allow editing
  - Auto-generation MUST trigger when video URL changes
  - Saves MUST succeed while transcript is generating
  - User transcript ALWAYS takes display priority
---

# Lesson Editor Transcripts

## Overview

The lesson editor provides a dual-tab interface for managing video transcripts. Users can view AI-generated transcripts or enter their own. When both exist, user transcripts take priority.

## Components

### Admin Console: `/src/components/admin/course-panels/LessonEditorPanel.tsx`
### Expert Console: `/src/app/author/courses/[id]/builder/ExpertLessonEditorPanel.tsx`

Both panels implement identical transcript functionality.

## UI Features

### 1. Default Video Source

"Upload" is the default/first option in the video source toggle:

```typescript
const [videoSource, setVideoSource] = useState<VideoSourceType>('upload');
```

### 2. Dual Transcript Tabs

```tsx
<div className="flex gap-2 p-1 bg-white/5 rounded-lg border border-white/10">
    <button
        onClick={() => setTranscriptTab('ai')}
        className={transcriptTab === 'ai' ? 'bg-purple-500/20 text-purple-300' : '...'}
    >
        <Bot size={14} />
        AI Generated
    </button>
    <button
        onClick={() => setTranscriptTab('user')}
        className={transcriptTab === 'user' ? 'bg-green-500/20 text-green-300' : '...'}
    >
        <User size={14} />
        Manual Entry
    </button>
</div>
```

### 3. Tab Behavior

**AI Generated Tab (Purple theme):**
- Read-only textarea (disabled)
- Shows AI-generated transcript
- "Regenerate" button when transcript exists
- Status messages based on state

**Manual Entry Tab (Green theme):**
- Editable textarea
- User can type or paste transcript
- "Clear Override" button when user transcript exists
- User transcript takes priority for display/RAG

### 4. Status Messages

```typescript
{isGeneratingTranscript
    ? 'AI transcript generation in progress...'
    : aiTranscript
        ? 'AI-generated transcript from video source.'
        : videoUrl
            ? 'AI transcript will be generated automatically.'
            : 'Add a video to generate transcript.'}
```

## Auto-Generation

### Trigger Conditions

```typescript
useEffect(() => {
    if (
        isOpen &&                                    // Panel is open
        type === 'video' &&                          // Video lesson type
        videoUrl &&                                  // Has video URL
        videoUrl !== previousVideoUrlRef.current &&  // URL changed
        !aiTranscript &&                            // No existing transcript
        !isGeneratingTranscript                     // Not already generating
    ) {
        previousVideoUrlRef.current = videoUrl;
        handleGenerateTranscript();
    }
}, [isOpen, type, videoUrl, aiTranscript, isGeneratingTranscript]);
```

### Generation Process

```typescript
const handleGenerateTranscript = useCallback(async () => {
    if (!videoUrl) return;

    setError(null);
    setIsGeneratingTranscript(true);
    setTranscriptStatus('generating');

    try {
        const result = await generateTranscriptFromVideo(videoUrl);

        if (result.success && result.transcript) {
            setAiTranscript(result.transcript);
            setTranscriptStatus('ready');
            setTranscriptSource(result.source || 'ai');
        } else {
            setError(result.error);
            setTranscriptStatus('failed');
        }
    } finally {
        setIsGeneratingTranscript(false);
    }
}, [videoUrl]);
```

## Save Behavior

### Allow Save During Generation

```typescript
const handleSave = useCallback(() => {
    // For video lessons, check transcript requirements
    if (type === 'video') {
        const transcriptExists = hasValidTranscript(content);

        // Allow save if generating - transcript will complete in background
        if (!transcriptExists && videoUrl && !isGeneratingTranscript) {
            setTranscriptModalMode('required');
            setShowTranscriptModal(true);
            return;
        }
    }

    performSave();
}, [type, content, videoUrl, isGeneratingTranscript]);
```

### Transcript Required Modal

Triggered when:
1. No transcript exists and not generating
2. Video changed with existing transcript (asks what to do)

```tsx
<TranscriptRequiredModal
    isOpen={showTranscriptModal}
    mode={transcriptModalMode}
    onClose={() => setShowTranscriptModal(false)}
    onEnterManually={handleEnterManually}
    onGenerateWithAI={handleGenerateWithAI}
    onKeepCurrent={handleKeepCurrent}
    isGenerating={isGeneratingTranscript}
    currentTranscript={getEffectiveTranscript()}
    transcriptSource={transcriptSource}
    onRegenerateAI={handleRegenerateAI}
/>
```

## TranscriptRequiredModal

### `/src/components/TranscriptRequiredModal.tsx`

Features:
- **Source Badge**: Visual indicator of transcript source
- **Transcript Preview**: First 200 characters of current transcript
- **Action Buttons**:
  - Enter Manually
  - Generate with AI
  - Keep Current (video-changed mode)
  - Regenerate AI Transcript

### Source Badge Component

```tsx
const SourceBadge: React.FC<{ source: TranscriptSource }> = ({ source }) => {
    const config = {
        'ai': { label: 'AI Generated', className: 'bg-purple-500/20 text-purple-300' },
        'user': { label: 'Manual Entry', className: 'bg-green-500/20 text-green-300' },
        'youtube': { label: 'YouTube', className: 'bg-red-500/20 text-red-300' },
        'legacy': { label: 'Legacy', className: 'bg-slate-500/20 text-slate-300' },
        // ...
    }[source];

    return <span className={config.className}>{config.label}</span>;
};
```

## State Management

### Transcript State

```typescript
const [aiTranscript, setAiTranscript] = useState(lessonContent);
const [userTranscript, setUserTranscript] = useState('');
const [transcriptTab, setTranscriptTab] = useState<'ai' | 'user'>('ai');
const [transcriptStatus, setTranscriptStatus] = useState<TranscriptStatus>('pending');
const [transcriptSource, setTranscriptSource] = useState<TranscriptSource>('none');
```

### Effective Transcript (for save)

```typescript
const getEffectiveTranscript = useCallback(() => {
    // User transcript takes priority
    if (userTranscript?.trim()) return userTranscript;
    if (aiTranscript?.trim()) return aiTranscript;
    return '';
}, [userTranscript, aiTranscript]);
```

## Visual Indicators

### Generation In Progress

```tsx
{isGeneratingTranscript && (
    <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
        <Loader2 className="animate-spin" />
        <p>Analyzing video and generating transcript...</p>
        <p className="text-xs">This may take a minute depending on video length</p>
    </div>
)}
```

### Textarea States

```tsx
<textarea
    value={transcriptTab === 'user' ? userTranscript : aiTranscript}
    disabled={isGeneratingTranscript || (transcriptTab === 'ai')}
    className={transcriptTab === 'ai' ? 'cursor-not-allowed' : ''}
/>
```

## Testing Checklist

- [ ] Upload video; verify auto-generation triggers
- [ ] Check AI tab is read-only
- [ ] Check Manual Entry tab is editable
- [ ] Save while generating; verify success
- [ ] Enter manual transcript; verify priority over AI
- [ ] Clear manual transcript; verify AI displays
- [ ] Change video; verify modal prompts
- [ ] Test regenerate button
- [ ] Verify source badges display correctly

## Related Docs

- `docs/features/video-transcript-generation.md` - Generation pipeline
- `docs/features/dual-transcript-storage.md` - Database schema
