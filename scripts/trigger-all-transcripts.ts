/**
 * Trigger Transcript Generation for All Courses
 *
 * Calls the process-videos endpoint for each production course to generate transcripts.
 *
 * Usage: npx ts-node --compiler-options '{"module":"commonjs"}' scripts/trigger-all-transcripts.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const PROD_URL = process.env.PROD_APP_URL!;
const SECRET_KEY = process.env.COURSE_IMPORT_SECRET!;

// Production course IDs to process (44 courses, excluding archived)
const PRODUCTION_COURSE_IDS = [
    613,  // The Control Spectrum
    627,  // The Orbits Model
    628,  // Alignment
    629,  // Environment
    630,  // Growth
    631,  // Impact
    632,  // Leaving Your Comfort Zone
    633,  // Mentor
    634,  // Momentum
    635,  // New Boots
    636,  // Relationship
    637,  // Renewal
    638,  // Space
    639,  // The 16 Elements – An Overview
    640,  // The Energy Iceberg Part 1
    641,  // The Energy Iceberg Part 2
    642,  // Value
    643,  // Why Energy Matters Most
    644,  // Choose to Thrive
    645,  // Identity
    646,  // Investment
    647,  // Objective
    648,  // Perspective
    649,  // Plan
    650,  // Score
    652,  // The Performance Iceberg
    653,  // Extraordinary vs Extravagant
    654,  // Leadership & Community - Orient (1 of 4)
    655,  // Leadership & Community - Assemble (2 of 4)
    656,  // Leadership & Community - Act (3 of 4)
    657,  // Leadership & Community - Achieve (4 of 4)
    658,  // Leadership and Resilience
    659,  // The Five Voices
    660,  // Leadership and Trust - Orient (1 of 4)
    661,  // Leadership and Trust - Assemble (2 of 4)
    662,  // Leadership and Trust - Act (3 of 4)
    663,  // Leadership and Trust - Achieve (4 of 4)
    664,  // Engagement During Leadership Transition
    665,  // Perspective and Identity
    666,  // Objective and Plan
    667,  // Relationship and Mentor
    668,  // Momentum and Alignment
    669,  // Environment and Space
    670,  // Investment and Score
];

async function triggerTranscriptGeneration(courseId: number): Promise<{ success: boolean; error?: string }> {
    try {
        const response = await fetch(`${PROD_URL}/api/course-import/process-videos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                courseId,
                secretKey: SECRET_KEY,
            }),
        });

        const result = await response.json();

        if (response.ok) {
            return { success: true };
        } else {
            return { success: false, error: result.error || 'Unknown error' };
        }
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

async function main() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('           TRIGGER TRANSCRIPT GENERATION FOR ALL COURSES');
    console.log('═══════════════════════════════════════════════════════════════\n');

    if (!PROD_URL || !SECRET_KEY) {
        console.error('❌ Missing PROD_APP_URL or COURSE_IMPORT_SECRET in .env.local');
        process.exit(1);
    }

    console.log(`🎯 Target: ${PROD_URL}`);
    console.log(`📦 Courses to process: ${PRODUCTION_COURSE_IDS.length}\n`);

    let triggered = 0;
    let failed = 0;
    const errors: { courseId: number; error: string }[] = [];

    for (const courseId of PRODUCTION_COURSE_IDS) {
        process.stdout.write(`  Triggering course ${courseId}... `);

        const result = await triggerTranscriptGeneration(courseId);

        if (result.success) {
            console.log('✅');
            triggered++;
        } else {
            console.log(`❌ ${result.error}`);
            failed++;
            errors.push({ courseId, error: result.error || 'Unknown' });
        }

        // Small delay between requests to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Summary
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('                        SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`  ✅ Triggered: ${triggered}`);
    console.log(`  ❌ Failed: ${failed}`);

    if (errors.length > 0) {
        console.log('\n  Failed courses:');
        errors.forEach(e => {
            console.log(`    - ${e.courseId}: ${e.error}`);
        });
    }

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('\n📝 Note: Transcript generation runs asynchronously.');
    console.log('   Check progress at: Admin > Courses (click a course to see transcript status)');
    console.log('   Or query: GET /api/course-import/status?courseId=XXX&secretKey=...');
}

main().catch(console.error);
