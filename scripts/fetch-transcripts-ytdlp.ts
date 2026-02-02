/**
 * Bulk Transcript Fetcher using yt-dlp
 *
 * Downloads captions for all YouTube videos in courses using yt-dlp,
 * then updates the production database with the transcripts.
 *
 * Usage: npx ts-node --compiler-options '{"module":"commonjs"}' scripts/fetch-transcripts-ytdlp.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const PROD_URL = process.env.PROD_APP_URL!;
const SECRET_KEY = process.env.COURSE_IMPORT_SECRET!;

// Production course ID range
const PROD_START = 627;
const PROD_END = 671;

// Temp directory for caption files
const TEMP_DIR = path.join(os.tmpdir(), 'yt-transcripts');

/**
 * Extract YouTube video ID from URL
 */
function extractVideoId(url: string): string | null {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
    return null;
}

/**
 * Parse VTT file to plain text transcript
 */
function parseVTT(vttContent: string): string {
    const lines = vttContent.split('\n');
    const textLines: string[] = [];
    let lastText = '';

    for (const line of lines) {
        // Skip WEBVTT header, timestamps, and empty lines
        if (line.startsWith('WEBVTT') ||
            line.startsWith('Kind:') ||
            line.startsWith('Language:') ||
            line.includes('-->') ||
            line.trim() === '') {
            continue;
        }

        // Remove VTT formatting tags like <c> and timestamps
        let text = line
            .replace(/<[^>]+>/g, '')  // Remove XML-like tags
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&#39;/g, "'")
            .replace(/&quot;/g, '"')
            .trim();

        // Avoid duplicates (VTT often repeats lines with slight additions)
        if (text && text !== lastText && !lastText.includes(text)) {
            textLines.push(text);
            lastText = text;
        }
    }

    // Join and clean up
    return textLines.join(' ')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Download captions using yt-dlp
 */
function downloadCaptions(videoId: string): string | null {
    const outputPath = path.join(TEMP_DIR, videoId);

    try {
        // Download auto-generated subtitles in English
        execSync(
            `yt-dlp --write-auto-sub --skip-download --sub-lang en -o "${outputPath}" "https://www.youtube.com/watch?v=${videoId}" 2>&1`,
            { timeout: 60000 }
        );

        // Check for the VTT file
        const vttFile = `${outputPath}.en.vtt`;
        if (fs.existsSync(vttFile)) {
            const content = fs.readFileSync(vttFile, 'utf-8');
            // Clean up
            fs.unlinkSync(vttFile);
            return parseVTT(content);
        }

        return null;
    } catch (err: any) {
        console.error(`  Error downloading: ${err.message?.substring(0, 100)}`);
        return null;
    }
}

/**
 * Fetch lessons needing transcripts from production
 */
async function fetchLessonsNeedingTranscripts(): Promise<any[]> {
    const response = await fetch(`${PROD_URL}/api/course-import/get-lessons-needing-transcripts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            startCourseId: PROD_START,
            endCourseId: PROD_END,
            secretKey: SECRET_KEY,
        }),
    });

    const result = await response.json();

    if (!result.success) {
        throw new Error(result.error || 'Failed to fetch lessons');
    }

    return result.lessons;
}

/**
 * Update production database via API
 */
async function updateProductionLesson(lessonId: string, transcript: string, courseId: number): Promise<boolean> {
    try {
        const response = await fetch(`${PROD_URL}/api/course-import/update-transcript`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                lessonId,
                transcript,
                courseId,
                secretKey: SECRET_KEY,
            }),
        });
        const result = await response.json();
        return result.success === true;
    } catch {
        return false;
    }
}

async function main() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('     TRANSCRIPT FETCHER USING YT-DLP (PRODUCTION)');
    console.log('═══════════════════════════════════════════════════════════════\n');

    if (!PROD_URL || !SECRET_KEY) {
        console.error('❌ Missing PROD_APP_URL or COURSE_IMPORT_SECRET in .env.local');
        process.exit(1);
    }

    console.log(`Target: ${PROD_URL}`);
    console.log(`Course range: ${PROD_START}-${PROD_END}\n`);

    // Create temp directory
    if (!fs.existsSync(TEMP_DIR)) {
        fs.mkdirSync(TEMP_DIR, { recursive: true });
    }

    // Fetch lessons from production
    console.log('Fetching lessons needing transcripts from production...\n');
    let lessons: any[];

    try {
        lessons = await fetchLessonsNeedingTranscripts();
    } catch (err: any) {
        console.error('❌ Failed to fetch lessons:', err.message);
        process.exit(1);
    }

    console.log(`Found ${lessons.length} lessons needing transcripts\n`);

    if (lessons.length === 0) {
        console.log('All lessons already have transcripts!');
        return;
    }

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < lessons.length; i++) {
        const lesson = lessons[i];
        const videoId = extractVideoId(lesson.video_url);

        process.stdout.write(`[${i + 1}/${lessons.length}] "${lesson.title.substring(0, 40)}..." `);

        if (!videoId) {
            console.log('❌ No video ID');
            failCount++;
            continue;
        }

        const transcript = downloadCaptions(videoId);

        if (!transcript || transcript.length < 50) {
            console.log('❌ No caption content');
            failCount++;
            continue;
        }

        // Update production
        const prodSuccess = await updateProductionLesson(lesson.id, transcript, lesson.course_id);

        if (prodSuccess) {
            console.log(`✅ ${transcript.length} chars`);
            successCount++;
        } else {
            console.log(`❌ API update failed`);
            failCount++;
        }

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Summary
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('                       SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Cleanup temp directory
    try {
        fs.rmdirSync(TEMP_DIR, { recursive: true });
    } catch {}
}

main().catch(console.error);
