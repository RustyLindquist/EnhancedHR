---
id: video-transcript-generation
owner: platform-engineering
status: active
stability: stable
last_updated: 2026-01-28
surfaces:
  routes:
    - /admin/courses/:id/builder (Admin Course Builder)
    - /author/courses/:id/builder (Expert Course Builder)
  components:
    - LessonEditorPanel.tsx (Admin)
    - ExpertLessonEditorPanel.tsx (Expert)
    - TranscriptRequiredModal.tsx
data:
  tables:
    - public.lessons (ai_transcript, user_transcript, transcript_source, transcript_status)
backend:
  actions:
    - src/app/actions/course-builder.ts (generateTranscriptFromVideo)
    - src/app/actions/mux.ts (Mux caption functions)
    - src/lib/whisper-transcription.ts
    - src/lib/vtt-parser.ts
    - src/lib/youtube.ts
ai:
  models:
    - Mux Auto-Caption (built-in)
    - OpenAI Whisper (whisper-1)
tests:
  local:
    - Upload Mux video; verify transcript generates via Mux captions
    - Add YouTube URL; verify transcript fetches from YouTube captions
    - Test Whisper fallback when Mux captions fail
  staging:
    - Verify transcript generation for production Mux assets
    - Test transcript regeneration after video change
invariants:
  - Lesson saves MUST succeed even if transcript generation is in progress (non-blocking)
  - User transcripts ALWAYS take priority over AI-generated transcripts
  - Mux uploads MUST enable master_access='temporary' and mp4_support='standard' for transcription
  - Transcript status MUST be tracked (pending, generating, ready, failed)
  - Mux captions are tried first; Whisper is fallback for Mux videos
  - YouTube videos try Innertube API first, then Supadata fallback
---

# Video Transcript Generation

## Overview

The Video Transcript Generation System provides automatic transcription for course lesson videos. It implements a multi-layer strategy that adapts to different video sources:

1. **Mux-hosted videos**: Mux Auto-Captions (primary) with Whisper fallback
2. **YouTube videos**: Innertube API (primary) with Supadata fallback
3. **External URLs**: Not supported for auto-transcription

The system is designed to be non-blocking: lesson saves succeed immediately while transcript generation runs in the background.

## Architecture

```
generateTranscriptFromVideo(videoUrl)
         |
         v
   Is YouTube URL? ----Yes----> fetchYouTubeTranscript()
         |                           |
         No                    Success?
         |                    /       \
         |                  Yes        No
         |                   |         |
         |                   |    generateTranscriptFromYouTubeAudio()
         |                   |         |
   Is Mux Playback ID? <-----+----Success?
         |                         /    \
        Yes                      Yes     No
         |                        |      |
         v                        |      v
  generateMuxCaptionTranscript()  |   Return error
         |                        |
    Success? -----No----> isWhisperAvailable()?
         |                        |
        Yes                  Yes  |  No
         |                    |   |   |
         v                    v   v   v
    Return transcript    transcribeWithWhisper()
                              |
                         Return result
```

## Core Components

### 1. Mux Caption Functions (`/src/app/actions/mux.ts`)

#### `requestMuxAutoCaption(assetId)`
Requests auto-generated English captions from Mux using the `generateSubtitles` API.

```typescript
// Returns track IDs for polling
const result = await requestMuxAutoCaption(assetId);
// { success: true, trackIds: ['track_abc123'] }
```

**Requirements**:
- Asset must have `master_access: 'temporary'` enabled at upload
- Asset must have audio track available

#### `waitForMuxCaptionReady(assetId, trackIds)`
Polls Mux API until caption track status is 'ready' or 'errored'.

```typescript
// Polls for ~2 minutes (40 attempts x 3 seconds)
const result = await waitForMuxCaptionReady(assetId, trackIds);
// { ready: true, vttUrl: 'https://stream.mux.com/xxx/text/track_abc.vtt' }
```

#### `fetchMuxVTT(vttUrl)`
Fetches the WebVTT content from Mux CDN.

```typescript
const result = await fetchMuxVTT(vttUrl);
// { success: true, content: 'WEBVTT\n\n00:00:00.000 --> 00:00:02.500\nHello...' }
```

### 2. Mux Upload Configuration

The `getMuxUploadUrl()` function configures uploads for transcription support:

```typescript
const upload = await mux.video.uploads.create({
    new_asset_settings: {
        playback_policy: ['public'],
        encoding_tier: 'smart',
        master_access: 'temporary',     // Enable audio track for captions
        mp4_support: 'standard',        // Enable MP4 renditions for Whisper
    },
    cors_origin: corsOrigin,
});
```

**Why these settings matter**:
- `master_access: 'temporary'`: Required for Mux to generate auto-captions
- `mp4_support: 'standard'`: Enables `high.mp4` URL for Whisper fallback

### 3. Whisper Fallback (`/src/lib/whisper-transcription.ts`)

When Mux captions fail, OpenAI Whisper provides fallback transcription.

```typescript
export async function transcribeWithWhisper(playbackId: string): Promise<TranscriptionResult> {
    // Fetch video from Mux MP4 rendition
    const videoUrl = `https://stream.mux.com/${playbackId}/high.mp4`;

    // Send to Whisper API
    const transcription = await openai.audio.transcriptions.create({
        file: file,
        model: 'whisper-1',
        response_format: 'text',
        language: 'en',
    });

    return { success: true, transcript: transcription };
}
```

**Limitations**:
- 25MB file size limit
- Requires `OPENAI_API_KEY` environment variable
- More expensive than Mux captions

### 4. VTT Parser (`/src/lib/vtt-parser.ts`)

Converts WebVTT captions to plain text transcript.

```typescript
export function parseVTTToTranscript(vttContent: string): string {
    // Removes timing information, cue identifiers, formatting
    // Deduplicates overlapping phrases
    // Returns clean plain text
}
```

**Features**:
- Removes VTT headers (WEBVTT, NOTE, STYLE, REGION)
- Strips timing lines (00:00:00.000 --> 00:00:00.000)
- Removes VTT formatting tags (<v>, <c>, <b>, <i>, etc.)
- Deduplicates sentences and repeated words

### 5. Transcript Orchestrator (`/src/app/actions/course-builder.ts`)

The `generateTranscriptFromVideo()` function orchestrates the entire pipeline:

```typescript
export async function generateTranscriptFromVideo(videoUrl: string): Promise<{
    success: boolean;
    transcript?: string;
    source?: 'youtube' | 'mux-caption' | 'whisper' | 'manual';
    error?: string;
}> {
    // 1. Check if YouTube URL -> Use YouTube pipeline
    if (await isYouTubeUrl(videoUrl)) {
        return youtubeTranscriptPipeline(videoUrl);
    }

    // 2. Check if Mux playback ID -> Use Mux/Whisper pipeline
    if (isMuxPlaybackId(videoUrl)) {
        return muxTranscriptPipeline(videoUrl);
    }

    // 3. External URL -> Not supported
    return { success: false, error: 'External URLs not supported' };
}
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MUX_TOKEN_ID` | Yes | Mux API token ID |
| `MUX_TOKEN_SECRET` | Yes | Mux API token secret |
| `OPENAI_API_KEY` | Optional | Required for Whisper fallback |
| `SUPADATA_API_KEY` | Optional | Supadata API for YouTube fallback |

## Transcript Sources

| Source | Description | When Used |
|--------|-------------|-----------|
| `youtube` | YouTube captions or Supadata | YouTube URLs |
| `mux-caption` | Mux auto-generated captions | Mux videos (primary) |
| `whisper` | OpenAI Whisper transcription | Mux videos (fallback) |
| `user` | Manual user entry | User overrides AI transcript |
| `legacy` | Pre-migration content | Existing lessons |
| `none` | No transcript | Initial state |

## Error Handling

| Failure | Symptom | Recovery |
|---------|---------|----------|
| Mux caption generation failed | `transcript_status: 'failed'` | System auto-falls back to Whisper |
| Whisper API error | `transcript_status: 'failed'` | User can click "Regenerate" |
| No audio track on Mux asset | Caption request fails | Check `master_access` setting |
| YouTube captions disabled | Primary fetch fails | Falls back to Supadata then AI |
| External URL | Not supported error | User must enter manually |

## Testing Checklist

- [ ] Upload Mux video; verify transcript generates automatically
- [ ] Check transcript source shows 'mux-caption' or 'whisper'
- [ ] Add YouTube video; verify transcript extracts from captions
- [ ] Test regenerate button on failed transcript
- [ ] Verify lesson saves succeed while transcript is generating
- [ ] Check VTT parser removes timing and formatting correctly

## Related Docs

- `docs/features/dual-transcript-storage.md` - Database schema for transcripts
- `docs/features/lesson-editor-transcripts.md` - UI components
- `docs/features/mux-video-cleanup.md` - Mux asset deletion
