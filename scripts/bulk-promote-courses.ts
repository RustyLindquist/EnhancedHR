/**
 * Bulk Course Promotion Script
 *
 * Promotes multiple courses from local development to production.
 * Includes progress tracking and status monitoring.
 *
 * Usage: npx ts-node --compiler-options '{"module":"commonjs"}' scripts/bulk-promote-courses.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const PROD_URL = process.env.PROD_APP_URL!;
const SECRET_KEY = process.env.COURSE_IMPORT_SECRET!;

// Course IDs to promote (the 44 migrated Leadership Academy courses)
const COURSE_IDS = Array.from({ length: 45 }, (_, i) => 637 + i).filter(id => id <= 681);

interface PromotionResult {
    courseId: number;
    title: string;
    success: boolean;
    productionCourseId?: number;
    error?: string;
}

interface CourseData {
    id: number;
    title: string;
    description: string;
    category: string;
    status: string;
    author: string;
    author_id: string;
    image_url: string;
    duration_minutes: number;
    skills: string[];
}

async function fetchCourseData(supabase: any, courseId: number) {
    // Fetch course
    const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

    if (courseError || !course) {
        throw new Error(`Course ${courseId} not found: ${courseError?.message}`);
    }

    // Fetch modules
    const { data: modules } = await supabase
        .from('modules')
        .select('*')
        .eq('course_id', courseId)
        .order('order', { ascending: true });

    // Fetch lessons
    const moduleIds = modules?.map((m: any) => m.id) || [];
    let lessons: any[] = [];

    if (moduleIds.length > 0) {
        const { data: lessonsData } = await supabase
            .from('lessons')
            .select('*')
            .in('module_id', moduleIds)
            .order('order', { ascending: true });
        lessons = lessonsData || [];
    }

    // Fetch resources
    const { data: resources } = await supabase
        .from('resources')
        .select('*')
        .eq('course_id', courseId);

    return { course, modules: modules || [], lessons, resources: resources || [] };
}

async function promoteCourse(courseData: any): Promise<{ success: boolean; productionCourseId?: number; error?: string }> {
    try {
        const response = await fetch(`${PROD_URL}/api/course-import`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                course: courseData.course,
                modules: courseData.modules,
                lessons: courseData.lessons,
                resources: courseData.resources,
                secretKey: SECRET_KEY,
            }),
        });

        const result = await response.json();

        if (!result.success) {
            return { success: false, error: result.error || 'Import failed' };
        }

        // Trigger video processing (fire and forget)
        fetch(`${PROD_URL}/api/course-import/process-videos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                courseId: result.productionCourseId,
                secretKey: SECRET_KEY,
            }),
        }).catch(() => {}); // Ignore errors

        return { success: true, productionCourseId: result.productionCourseId };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

async function checkAllStatuses(): Promise<any[]> {
    try {
        const response = await fetch(`${PROD_URL}/api/course-import/status/all?secretKey=${SECRET_KEY}`);
        const result = await response.json();
        return result.statuses || [];
    } catch {
        return [];
    }
}

async function main() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('         BULK COURSE PROMOTION TO PRODUCTION');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`Target: ${PROD_URL}`);
    console.log(`Courses to promote: ${COURSE_IDS.length}`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    if (!PROD_URL || !SECRET_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
        console.error('❌ Missing required environment variables');
        process.exit(1);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const results: PromotionResult[] = [];
    const startTime = Date.now();

    for (let i = 0; i < COURSE_IDS.length; i++) {
        const courseId = COURSE_IDS[i];
        const progress = `[${i + 1}/${COURSE_IDS.length}]`;

        try {
            // Fetch course data
            const courseData = await fetchCourseData(supabase, courseId);
            const title = courseData.course.title;

            process.stdout.write(`${progress} Promoting "${title}" (ID: ${courseId})... `);

            // Promote to production
            const result = await promoteCourse(courseData);

            if (result.success) {
                console.log(`✅ Production ID: ${result.productionCourseId}`);
                results.push({
                    courseId,
                    title,
                    success: true,
                    productionCourseId: result.productionCourseId,
                });
            } else {
                console.log(`❌ ${result.error}`);
                results.push({
                    courseId,
                    title,
                    success: false,
                    error: result.error,
                });
            }

            // Small delay to avoid overwhelming the server
            await new Promise(resolve => setTimeout(resolve, 500));

        } catch (error: any) {
            console.log(`❌ ${error.message}`);
            results.push({
                courseId,
                title: `Course ${courseId}`,
                success: false,
                error: error.message,
            });
        }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    // Summary
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('                      PROMOTION SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════');

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    console.log(`✅ Successful: ${successful.length}/${results.length}`);
    console.log(`❌ Failed: ${failed.length}/${results.length}`);
    console.log(`⏱️  Duration: ${elapsed}s`);

    if (failed.length > 0) {
        console.log('\n--- Failed Promotions ---');
        failed.forEach(f => {
            console.log(`  • ${f.title} (ID: ${f.courseId}): ${f.error}`);
        });
    }

    // Check video processing statuses
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('              VIDEO PROCESSING STATUS');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('Note: Video processing runs asynchronously. Checking initial status...\n');

    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s for status records

    const statuses = await checkAllStatuses();
    const productionIds = successful.map(s => s.productionCourseId);
    const relevantStatuses = statuses.filter(s => productionIds.includes(s.course_id));

    if (relevantStatuses.length > 0) {
        const pending = relevantStatuses.filter(s => s.status === 'pending').length;
        const processing = relevantStatuses.filter(s => s.status === 'processing').length;
        const complete = relevantStatuses.filter(s => s.status === 'complete').length;
        const errored = relevantStatuses.filter(s => s.status === 'error').length;

        console.log(`📊 Video Processing Status:`);
        console.log(`   • Pending: ${pending}`);
        console.log(`   • Processing: ${processing}`);
        console.log(`   • Complete: ${complete}`);
        console.log(`   • Error: ${errored}`);

        if (errored > 0) {
            console.log('\n--- Processing Errors ---');
            relevantStatuses
                .filter(s => s.status === 'error')
                .forEach(s => {
                    console.log(`  • Course ${s.course_id}: ${s.error_message}`);
                });
        }
    } else {
        console.log('No video processing status records found yet. Processing may still be starting.');
    }

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('Run this command later to check video processing status:');
    console.log('  curl "${PROD_URL}/api/course-import/status/all?secretKey=${SECRET_KEY}" | jq');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Return results for programmatic use
    return { results, successful: successful.length, failed: failed.length };
}

main().catch(console.error);
