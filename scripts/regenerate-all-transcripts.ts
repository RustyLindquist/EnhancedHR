/**
 * Bulk Transcript Regeneration Script
 *
 * Regenerates transcripts for all Leadership Academy courses on production.
 * Processes courses sequentially with delays to avoid API rate limits.
 *
 * Usage: npx ts-node --compiler-options '{"module":"commonjs"}' scripts/regenerate-all-transcripts.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const PROD_URL = process.env.PROD_APP_URL!;
const SECRET_KEY = process.env.COURSE_IMPORT_SECRET!;

// Production course IDs for Leadership Academy (627-671)
const PROD_START = 627;
const PROD_END = 671;

// Delay between courses (30 seconds to be safe)
const DELAY_BETWEEN_COURSES_MS = 30000;

interface RegenerateResult {
    success: boolean;
    results?: {
        lessonsGenerated: number;
        lessonsSkipped: number;
        lessonsFailed: number;
        failedLessons?: { title: string; error: string }[];
    };
    error?: string;
}

async function regenerateCourseTranscripts(courseId: number): Promise<RegenerateResult> {
    try {
        const response = await fetch(`${PROD_URL}/api/course-import/regenerate-transcripts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                courseId,
                secretKey: SECRET_KEY,
            }),
        });

        const responseText = await response.text();

        if (!response.ok) {
            return { success: false, error: `HTTP ${response.status}: ${responseText.substring(0, 200)}` };
        }

        if (!responseText || responseText.trim() === '') {
            return { success: false, error: 'Empty response from API' };
        }

        return JSON.parse(responseText);
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

async function main() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('       BULK TRANSCRIPT REGENERATION FOR ALL COURSES');
    console.log('═══════════════════════════════════════════════════════════════\n');

    if (!PROD_URL || !SECRET_KEY) {
        console.error('❌ Missing PROD_APP_URL or COURSE_IMPORT_SECRET');
        process.exit(1);
    }

    console.log(`Target: ${PROD_URL}`);
    console.log(`Processing courses ${PROD_START} to ${PROD_END} (${PROD_END - PROD_START + 1} total)\n`);

    let totalGenerated = 0;
    let totalSkipped = 0;
    let totalFailed = 0;
    let coursesProcessed = 0;
    let coursesWithErrors = 0;

    const allFailedLessons: { courseId: number; title: string; error: string }[] = [];

    for (let courseId = PROD_START; courseId <= PROD_END; courseId++) {
        const progress = `[${courseId - PROD_START + 1}/${PROD_END - PROD_START + 1}]`;
        process.stdout.write(`${progress} Course ${courseId}... `);

        const result = await regenerateCourseTranscripts(courseId);

        if (result.success && result.results) {
            const { lessonsGenerated, lessonsSkipped, lessonsFailed, failedLessons } = result.results;

            totalGenerated += lessonsGenerated;
            totalSkipped += lessonsSkipped;
            totalFailed += lessonsFailed;
            coursesProcessed++;

            if (failedLessons) {
                failedLessons.forEach(f => {
                    allFailedLessons.push({ courseId, ...f });
                });
            }

            if (lessonsFailed > 0) {
                console.log(`⚠️  Generated: ${lessonsGenerated}, Skipped: ${lessonsSkipped}, Failed: ${lessonsFailed}`);
                coursesWithErrors++;
            } else if (lessonsGenerated > 0) {
                console.log(`✅ Generated: ${lessonsGenerated}, Skipped: ${lessonsSkipped}`);
            } else {
                console.log(`⏭️  All ${lessonsSkipped} lessons skipped (already have transcripts)`);
            }
        } else {
            console.log(`❌ ${result.error}`);
            coursesWithErrors++;
        }

        // Delay between courses (except for the last one)
        if (courseId < PROD_END) {
            process.stdout.write(`   Waiting ${DELAY_BETWEEN_COURSES_MS / 1000}s before next course...\n`);
            await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_COURSES_MS));
        }
    }

    // Summary
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('                     REGENERATION SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`Courses processed: ${coursesProcessed}/${PROD_END - PROD_START + 1}`);
    console.log(`Courses with errors: ${coursesWithErrors}`);
    console.log('');
    console.log(`Total lessons generated: ${totalGenerated}`);
    console.log(`Total lessons skipped: ${totalSkipped}`);
    console.log(`Total lessons failed: ${totalFailed}`);

    if (allFailedLessons.length > 0) {
        console.log('\n--- Failed Lessons ---');
        allFailedLessons.slice(0, 20).forEach(f => {
            console.log(`  Course ${f.courseId}: "${f.title}" - ${f.error}`);
        });
        if (allFailedLessons.length > 20) {
            console.log(`  ... and ${allFailedLessons.length - 20} more`);
        }
    }

    console.log('\n═══════════════════════════════════════════════════════════════');

    // Calculate estimated time for next run
    const estimatedTime = ((PROD_END - PROD_START + 1) * DELAY_BETWEEN_COURSES_MS) / 1000 / 60;
    console.log(`\nNote: Full run takes approximately ${estimatedTime.toFixed(0)} minutes due to rate limiting.`);
}

main().catch(console.error);
