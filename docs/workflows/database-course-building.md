# Database Course Building Workflow

## Overview

For bulk course creation, building directly in the database is much faster than using the admin UI or browser automation. This workflow documents the process used to create courses 618 and 621.

## Prerequisites

- YouTube API key (configured in `src/lib/youtube.ts`)
- Access to Supabase database via Docker
- YouTube playlist or video IDs

## Step-by-Step Process

### 1. Collect Video Information from YouTube

Use the YouTube Data API to fetch videos from a playlist:

```bash
API_KEY="AIzaSyCUn0lP6d8QHTV790LuBlabfGydz2H-fFU"
PLAYLIST_ID="PLs976frGjku4OKSy_yRCXg_AkY6LSedet"

# Get playlist items (max 50 per request)
curl -s "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${PLAYLIST_ID}&maxResults=50&key=${API_KEY}" | jq '.items[] | {title: .snippet.title, videoId: .snippet.resourceId.videoId}'
```

### 2. Get Video Durations

YouTube durations are in ISO 8601 format (PT1M21S = 1:21):

```bash
VIDEO_IDS="VIDEO_ID_1,VIDEO_ID_2,VIDEO_ID_3"
curl -s "https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${VIDEO_IDS}&key=${API_KEY}" | jq '.items[] | {videoId: .id, duration: .contentDetails.duration}'
```

### 3. Create Course Record

```sql
INSERT INTO courses (title, description, author, category, featured_image, duration, status)
VALUES (
    'Course Title',
    'Course description here. Write compelling description that explains what the learner will gain.',
    'Rusty Lindquist',
    'Leadership Development',
    'https://img.youtube.com/vi/FIRST_VIDEO_ID/maxresdefault.jpg',
    '30 min',
    'published'
)
RETURNING id;
```

**Notes:**
- `featured_image`: Use `https://img.youtube.com/vi/VIDEO_ID/maxresdefault.jpg` from first video
- `duration`: Total course duration in "X min" format
- `category`: Must match existing categories (Leadership Development, HR Fundamentals, etc.)

### 4. Create Module Record

```sql
INSERT INTO modules (course_id, title, position)
VALUES (COURSE_ID, 'Main Content', 1)
RETURNING id;
```

### 5. Create Lesson Records

```sql
INSERT INTO lessons (module_id, title, video_url, type, position, duration)
VALUES
    (MODULE_ID, 'Lesson 1 Title', 'https://www.youtube.com/watch?v=VIDEO_ID_1', 'video', 1, '2:30'),
    (MODULE_ID, 'Lesson 2 Title', 'https://www.youtube.com/watch?v=VIDEO_ID_2', 'video', 2, '3:15'),
    (MODULE_ID, 'Lesson 3 Title', 'https://www.youtube.com/watch?v=VIDEO_ID_3', 'video', 3, '1:45')
;
```

**Duration format:** Use "M:SS" or "MM:SS" for lesson durations.

### 6. Convert ISO 8601 Duration to M:SS

Parse YouTube's ISO 8601 duration format:

```javascript
// PT1M21S -> 1:21
// PT12M5S -> 12:05
// PT2H1M30S -> 121:30 (hours * 60 + minutes)

function parseDuration(iso) {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  const hours = parseInt(match[1] || 0);
  const minutes = parseInt(match[2] || 0);
  const seconds = parseInt(match[3] || 0);
  const totalMinutes = hours * 60 + minutes;
  return `${totalMinutes}:${seconds.toString().padStart(2, '0')}`;
}
```

### 7. Update Course Total Duration

Sum all lesson durations and update the course:

```sql
UPDATE courses SET duration = '29 min' WHERE id = COURSE_ID;
```

### 8. Verify Course Created Successfully

```sql
-- Check course
SELECT id, title, duration, status FROM courses WHERE id = COURSE_ID;

-- Check modules
SELECT id, title, position FROM modules WHERE course_id = COURSE_ID;

-- Check lessons
SELECT id, title, duration, position, video_url FROM lessons WHERE module_id = MODULE_ID ORDER BY position;
```

## Example: Course 618 "Extraordinary vs Extravagant"

Created with 18 YouTube videos from the 0521-0543 range (some numbers missing due to re-uploads):

```sql
-- Course
INSERT INTO courses (title, description, author, category, featured_image, duration, status)
VALUES (
    'Extraordinary vs Extravagant',
    'Learn the critical distinction between extraordinary and extravagant in leadership...',
    'Rusty Lindquist',
    'Leadership Development',
    'https://img.youtube.com/vi/S6qrXkXDBa8/maxresdefault.jpg',
    '29 min',
    'published'
);

-- Module
INSERT INTO modules (course_id, title, position)
VALUES (618, 'Main Content', 1);

-- Lessons (18 total)
INSERT INTO lessons (module_id, title, video_url, type, position, duration)
VALUES
    (MODULE_ID, 'Video Title 1', 'https://www.youtube.com/watch?v=S6qrXkXDBa8', 'video', 1, '1:27'),
    -- ... 17 more lessons
;
```

## Example: Course 621 "Choose To Thrive"

Created with 10 YouTube videos from the 0256-0382 range:

```sql
-- Course
INSERT INTO courses (title, description, author, category, featured_image, duration, status)
VALUES (
    'Choose To Thrive',
    'A comprehensive exploration of how to move beyond surviving to truly thriving...',
    'Rusty Lindquist',
    'Leadership Development',
    'https://img.youtube.com/vi/qyMRl-dRb2I/maxresdefault.jpg',
    '27 min',
    'published'
);
```

## Important Notes

1. **Video URL format**: Always use full YouTube watch URL: `https://www.youtube.com/watch?v=VIDEO_ID`

2. **Featured image**: Use maxresdefault.jpg from the first video for best quality

3. **Duration accuracy**: Course duration should reflect actual total, not just a sum (account for loading, etc.)

4. **Category consistency**: Use existing categories from the database to maintain filtering consistency

5. **Status**: Set to 'published' to make immediately available, or 'draft' for review

6. **Transcripts**: After course creation, transcripts are generated automatically when:
   - Course is promoted via Course Promotion feature
   - Videos are processed through the transcript pipeline

## Database Access via Docker

```bash
# Connect to Supabase PostgreSQL
docker exec -it supabase_db_enhancedhr psql -U postgres -d postgres

# Or run single query
docker exec -i supabase_db_enhancedhr psql -U postgres -d postgres -c "SELECT * FROM courses ORDER BY id DESC LIMIT 5;"
```

## Related Docs

- `docs/features/course-promotion.md` - Automated promotion with transcripts
- `docs/features/video-ai-context.md` - Video transcript extraction
- `docs/features/course-player-and-progress.md` - Course structure requirements
