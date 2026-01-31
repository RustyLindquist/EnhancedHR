# File Uploads & Network Patterns — Foundation Doc

## Overview

This document covers file upload patterns, network resilience strategies, and known issues when deploying to Vercel with large file uploads. These patterns are essential for handling files up to 25MB reliably across different network conditions.

## Key Constraints

### Vercel Request Body Limit

Vercel has an approximate **4.5MB request body limit** for serverless functions. Files larger than this will fail with a 413 or network error.

### ISP TLS/SSL Interference

Some ISPs (notably **Xfinity with xFi Advanced Security**) perform deep packet inspection that can corrupt TLS connections, causing `ERR_SSL_BAD_RECORD_MAC_ALERT` errors. This affects:
- Direct uploads to external services (Mux, Supabase Storage)
- Even same-origin uploads after several MB transferred

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       FILE UPLOAD SYSTEM                                 │
│                                                                          │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                        Client                                      │  │
│  │   ┌─────────────┐   ┌─────────────┐   ┌─────────────────────┐    │  │
│  │   │  Select     │   │  Chunk      │   │  Upload via         │    │  │
│  │   │  File       │──▶│  (1-2MB)    │──▶│  XMLHttpRequest     │    │  │
│  │   └─────────────┘   └─────────────┘   └─────────────────────┘    │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                              │                                           │
│                              ▼                                           │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                    Server (API Routes)                             │  │
│  │   ┌─────────────┐   ┌─────────────┐   ┌─────────────────────┐    │  │
│  │   │  Receive    │   │  Store      │   │  On Last Chunk:     │    │  │
│  │   │  Chunk      │──▶│  as Temp    │──▶│  Combine & Finalize │    │  │
│  │   └─────────────┘   └─────────────┘   └─────────────────────┘    │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                              │                                           │
│                              ▼                                           │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                    Supabase Storage                                │  │
│  │   chunk.0  chunk.1  chunk.2  ...  →  final-file.pdf              │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

## Chunked Upload Pattern

### Solution Overview

Files are split into 1-2MB chunks on the client, uploaded separately to the server, then combined server-side before being stored to Supabase Storage.

### Chunk Size Selection

| Context | Chunk Size | Rationale |
|---------|------------|-----------|
| Expert Resources | 2MB | Standard files, typical networks |
| Video Proxy | 1MB | Smaller to reduce ISP interference window |

### Client-Side Implementation

```typescript
// Client-side chunking with retry logic
const CHUNK_SIZE = 1 * 1024 * 1024; // 1MB chunks
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second base delay

const fileBuffer = await file.arrayBuffer();
const totalChunks = Math.ceil(fileBuffer.byteLength / CHUNK_SIZE);

// Helper for exponential backoff
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Upload each chunk with retry logic
for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, fileBuffer.byteLength);
    const chunk = fileBuffer.slice(start, end);

    let chunkSuccess = false;
    let lastError = '';

    for (let attempt = 1; attempt <= MAX_RETRIES && !chunkSuccess; attempt++) {
        const result = await uploadChunk(i, chunk);

        if (result.success) {
            chunkSuccess = true;
        } else {
            lastError = result.error || 'Unknown error';
            if (attempt < MAX_RETRIES) {
                await delay(RETRY_DELAY * attempt); // Exponential backoff
            }
        }
    }

    if (!chunkSuccess) {
        throw new Error(`Chunk ${i + 1} failed after ${MAX_RETRIES} attempts: ${lastError}`);
    }
}
```

### Server-Side Implementation

```typescript
// API route receives chunks and combines on final chunk
export async function POST(request: NextRequest) {
    const storagePath = request.headers.get('X-Storage-Path');
    const chunkIndex = parseInt(request.headers.get('X-Chunk-Index') || '0', 10);
    const totalChunks = parseInt(request.headers.get('X-Total-Chunks') || '1', 10);
    const fileType = request.headers.get('X-File-Type') || 'application/octet-stream';

    const chunkData = await request.arrayBuffer();
    const chunkBuffer = Buffer.from(chunkData);

    // Store chunk as separate file
    const chunkPath = `${storagePath}.chunk.${chunkIndex}`;
    await admin.storage.from(BUCKET).upload(chunkPath, chunkBuffer, {
        contentType: 'application/octet-stream',
        upsert: true
    });

    // If last chunk, combine all chunks
    if (chunkIndex === totalChunks - 1) {
        const chunks: Buffer[] = [];
        for (let i = 0; i < totalChunks; i++) {
            const { data } = await admin.storage.from(BUCKET).download(`${storagePath}.chunk.${i}`);
            chunks.push(Buffer.from(await data.arrayBuffer()));
        }

        const completeFile = Buffer.concat(chunks);
        await admin.storage.from(BUCKET).upload(storagePath, completeFile, {
            contentType: fileType,
            upsert: true
        });

        // Clean up chunk files
        const chunkPaths = Array.from({ length: totalChunks }, (_, i) => `${storagePath}.chunk.${i}`);
        await admin.storage.from(BUCKET).remove(chunkPaths);
    }

    return NextResponse.json({ success: true, complete: chunkIndex === totalChunks - 1 });
}
```

## Files Implementing This Pattern

| File | Purpose |
|------|---------|
| `src/app/api/upload/expert-resource/chunk/route.ts` | Server-side chunk handling for expert resource files |
| `src/app/api/upload/video/chunk/route.ts` | Server-side chunk handling for video proxy uploads |
| `src/app/author/resources/ExpertResourcesCanvas.tsx` | Client-side chunking for expert resources (in handleCreateExpertFile) |
| `src/components/VideoPanel.tsx` | Client-side chunking for video proxy upload |

## ISP TLS Interference Solutions

### Symptoms

- `ERR_SSL_BAD_RECORD_MAC_ALERT` errors during upload
- Uploads fail after transferring several MB
- Direct uploads to Mux/Supabase fail but server-proxied uploads work

### Technical Solutions Implemented

1. **Retry Logic with Exponential Backoff**
   - 3 retry attempts per chunk
   - Increasing delay between retries (1s, 2s, 3s)

2. **Smaller Chunk Sizes**
   - 1MB instead of 2MB for video uploads
   - Reduces the window where interference can occur

3. **Fallback from Direct to Proxy Upload**
   - First attempt: Direct upload to Mux
   - On failure: Fall back to chunked server proxy

### User-Side Workarounds

If users experience persistent upload failures:

1. **Disable xFi Advanced Security** (Xfinity routers)
   - xFi app → More → xFi Advanced Security → Turn off

2. **Use a VPN**
   - Encrypts traffic end-to-end, bypassing ISP inspection

3. **Use Mobile Hotspot**
   - Cellular networks typically don't have this issue

## React State Sync Pattern

### Problem

When using `useState(initialProps)` with server-side rendering, the state only initializes from props on first mount. After `router.refresh()`, the props change but `useState` does not re-initialize.

### Solution

Add a `useEffect` to sync state when props change:

```typescript
interface Props {
    initialResources: ExpertResource[];
}

export function ExpertResourcesCanvas({ initialResources }: Props) {
    const [resources, setResources] = useState(initialResources);

    // Sync local state when server data changes (e.g., after router.refresh())
    useEffect(() => {
        setResources(initialResources);
    }, [initialResources]);

    // ... rest of component
}
```

### When This Is Needed

- Components that manage local state from server props
- After calling `router.refresh()` to reload server data
- When optimistic updates need to reconcile with server state

### File Reference

`src/app/author/resources/ExpertResourcesCanvas.tsx` - Lines 64-67

## Supabase Storage Configuration

### Bucket Configuration Migrations

| Migration | Purpose |
|-----------|---------|
| `20260129090000_update_context_bucket_limits.sql` | Increased file size limit to 25MB, added PPTX mime types |
| `20260129100000_update_temp_video_bucket_for_chunks.sql` | Added `application/octet-stream` for chunk uploads |

### Required Mime Types

For the `user-context-files` bucket (expert resources):

```sql
-- Allowed mime types
'{
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation"
}'
```

For the `temp-video-uploads` bucket (video chunks):

```sql
-- Must include application/octet-stream for chunk uploads
'{
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-msvideo",
  "video/x-matroska",
  "application/octet-stream"
}'
```

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| 413 Payload Too Large | File exceeds Vercel limit | Use chunked upload |
| ERR_SSL_BAD_RECORD_MAC_ALERT | ISP TLS interference | Retry with smaller chunks, use VPN |
| CORS error on direct upload | Network/ISP issue | Fall back to server proxy |
| Chunk N missing | Server lost chunk during combine | Retry entire upload |

## Security Invariants

1. **Authentication Required**: All chunk upload endpoints verify user authentication
2. **Authorization Check**: Expert resource uploads verify platform admin role
3. **Storage Path Validation**: Server validates storage paths to prevent path traversal
4. **Chunk Cleanup**: Temporary chunk files are always cleaned up after combining
5. **Content-Type Verification**: File types are validated against allowed mime types

## Testing Checklist

- [ ] Upload file under 4.5MB (should use direct upload if available)
- [ ] Upload file over 4.5MB (should use chunked upload)
- [ ] Upload with simulated network interruption (should retry)
- [ ] Verify chunk cleanup after successful upload
- [ ] Verify chunk cleanup after failed upload
- [ ] Test with VPN to verify ISP interference workaround
- [ ] Verify state sync after router.refresh()

## Related Docs

- `docs/foundation/video-mux.md` — Video upload and playback system
- `docs/features/expert-resources.md` — Expert Resources feature documentation
- `docs/foundation/supabase-schema-and-migrations.md` — Database migrations
