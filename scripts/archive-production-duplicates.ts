/**
 * Archive Production Duplicates
 *
 * Archives duplicate and orphan courses on production that were identified
 * by the production-sync-mapping script.
 *
 * Usage: npx ts-node --compiler-options '{"module":"commonjs"}' scripts/archive-production-duplicates.ts
 *
 * Prerequisites:
 * - The /api/course-import/archive endpoint must be deployed to production
 * - PROD_APP_URL and COURSE_IMPORT_SECRET must be set in .env.local
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const PROD_URL = process.env.PROD_APP_URL!;
const SECRET_KEY = process.env.COURSE_IMPORT_SECRET!;

// Courses to archive (from production-sync-mapping analysis)
const COURSES_TO_ARCHIVE = [
    { prodId: 612, title: 'The Control Spectrum', reason: 'Empty duplicate' },
    { prodId: 614, title: 'Choose To Thrive', reason: 'Duplicate of 644' },
    { prodId: 615, title: 'Extraordinary vs Extravagant', reason: 'Duplicate of 653 (fewer videos)' },
    { prodId: 620, title: 'Objective and Plan', reason: 'Duplicate of 666' },
    { prodId: 621, title: 'Investment and Score', reason: 'Duplicate of 670' },
    { prodId: 623, title: 'People Create Value', reason: 'Orphan (deleted locally)' },
    { prodId: 624, title: 'Perspective and Identity', reason: 'Duplicate of 665' },
    { prodId: 651, title: 'The Control Spectrum', reason: 'Duplicate of 613 (fewer videos)' },
];

async function archiveCourse(courseId: number): Promise<{ success: boolean; error?: string }> {
    try {
        const response = await fetch(`${PROD_URL}/api/course-import/archive`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                courseId,
                secretKey: SECRET_KEY,
            }),
        });

        const result = await response.json();
        return result;
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

async function main() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('           ARCHIVE PRODUCTION DUPLICATES');
    console.log('═══════════════════════════════════════════════════════════════\n');

    if (!PROD_URL || !SECRET_KEY) {
        console.error('❌ Missing PROD_APP_URL or COURSE_IMPORT_SECRET in .env.local');
        process.exit(1);
    }

    console.log(`🎯 Target: ${PROD_URL}`);
    console.log(`📦 Courses to archive: ${COURSES_TO_ARCHIVE.length}\n`);

    const results: { courseId: number; title: string; success: boolean; error?: string }[] = [];

    for (const course of COURSES_TO_ARCHIVE) {
        process.stdout.write(`  Archiving ${course.prodId}: "${course.title}"... `);

        const result = await archiveCourse(course.prodId);

        if (result.success) {
            console.log('✅');
            results.push({ courseId: course.prodId, title: course.title, success: true });
        } else {
            console.log(`❌ ${result.error}`);
            results.push({ courseId: course.prodId, title: course.title, success: false, error: result.error });
        }

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 300));
    }

    // Summary
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('                        SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`  ✅ Archived: ${successful}`);
    console.log(`  ❌ Failed: ${failed}`);

    if (failed > 0) {
        console.log('\n  Failed courses:');
        results.filter(r => !r.success).forEach(r => {
            console.log(`    - ${r.courseId}: ${r.title} (${r.error})`);
        });
    }

    console.log('\n═══════════════════════════════════════════════════════════════');

    // Save results to file
    const outputPath = path.resolve(__dirname, '../.context/archive-results.json');
    fs.writeFileSync(outputPath, JSON.stringify({ timestamp: new Date().toISOString(), results }, null, 2));
    console.log(`\nResults saved to: ${outputPath}`);
}

main().catch(console.error);
