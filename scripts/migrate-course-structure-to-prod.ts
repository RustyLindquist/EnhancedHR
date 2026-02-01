/**
 * Migrate Course Structure to Production
 *
 * Reads the local course module/lesson structure and replicates it to production.
 * This updates module titles and lesson titles while preserving video URLs.
 *
 * Usage: npx ts-node --compiler-options '{"module":"commonjs"}' scripts/migrate-course-structure-to-prod.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const LOCAL_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const LOCAL_SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const PROD_URL = process.env.PROD_APP_URL!;
const SECRET_KEY = process.env.COURSE_IMPORT_SECRET!;

// Course ID mapping: local ID -> production ID
const LOCAL_START = 637;
const PROD_START = 627;
const LOCAL_END = 681;

interface LessonData {
    title: string;
    video_url: string | null;
    order: number;
    content: string | null;
    duration: string | null;
}

interface ModuleData {
    title: string;
    order: number;
    lessons: LessonData[];
}

/**
 * Send structure to production API with retry logic
 */
async function sendStructureToProduction(
    courseId: number,
    modules: ModuleData[],
    maxRetries: number = 3
): Promise<{ success: boolean; error?: string }> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetch(`${PROD_URL}/api/course-import/update-structure`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    courseId,
                    modules,
                    secretKey: SECRET_KEY,
                }),
            });

            const responseText = await response.text();

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${responseText.substring(0, 200)}`);
            }

            if (!responseText || responseText.trim() === '') {
                if (attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
                    continue;
                }
                throw new Error('Empty response from API');
            }

            const result = JSON.parse(responseText);

            if (!result.success) {
                return { success: false, error: result.error };
            }

            return { success: true };
        } catch (err: any) {
            if (attempt === maxRetries) {
                return { success: false, error: err.message };
            }
            await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
        }
    }

    return { success: false, error: 'Max retries exceeded' };
}

async function main() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('       MIGRATE COURSE STRUCTURE TO PRODUCTION');
    console.log('═══════════════════════════════════════════════════════════════\n');

    if (!PROD_URL || !SECRET_KEY) {
        console.error('❌ Missing PROD_APP_URL or COURSE_IMPORT_SECRET');
        process.exit(1);
    }

    console.log(`Target: ${PROD_URL}\n`);

    const localSupabase = createClient(LOCAL_SUPABASE_URL, LOCAL_SUPABASE_KEY);

    // Get all courses
    const { data: courses, error } = await localSupabase
        .from('courses')
        .select('id, title')
        .gte('id', LOCAL_START)
        .lte('id', LOCAL_END)
        .order('id');

    if (error || !courses) {
        console.error('❌ Error fetching courses:', error);
        process.exit(1);
    }

    console.log(`📦 Found ${courses.length} courses to migrate\n`);

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < courses.length; i++) {
        const course = courses[i];
        const prodId = course.id - LOCAL_START + PROD_START;
        const progress = `[${i + 1}/${courses.length}]`;

        process.stdout.write(`${progress} "${course.title}" (local:${course.id} → prod:${prodId})... `);

        try {
            // Get modules for this course
            const { data: modules } = await localSupabase
                .from('modules')
                .select('id, title, order')
                .eq('course_id', course.id)
                .order('order');

            if (!modules || modules.length === 0) {
                console.log('⚠️ No modules');
                errors.push(`${course.title}: No modules found`);
                errorCount++;
                continue;
            }

            // Build module structure with lessons
            const moduleData: ModuleData[] = [];

            for (const mod of modules) {
                const { data: lessons } = await localSupabase
                    .from('lessons')
                    .select('title, video_url, order, content, duration')
                    .eq('module_id', mod.id)
                    .order('order');

                moduleData.push({
                    title: mod.title,
                    order: mod.order,
                    lessons: (lessons || []).map(l => ({
                        title: l.title,
                        video_url: l.video_url,
                        order: l.order,
                        content: l.content,
                        duration: l.duration
                    }))
                });
            }

            // Count total lessons
            const totalLessons = moduleData.reduce((sum, m) => sum + m.lessons.length, 0);

            // Send to production
            const result = await sendStructureToProduction(prodId, moduleData);

            if (!result.success) {
                throw new Error(result.error || 'Unknown error');
            }

            console.log(`✅ ${modules.length} modules, ${totalLessons} lessons`);
            successCount++;

            // Small delay to avoid rate limits
            await new Promise(resolve => setTimeout(resolve, 300));

        } catch (err: any) {
            console.log(`❌ ${err.message}`);
            errors.push(`${course.title}: ${err.message}`);
            errorCount++;
        }
    }

    // Summary
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('                     MIGRATION SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`✅ Successful: ${successCount}/${courses.length}`);
    console.log(`❌ Failed: ${errorCount}/${courses.length}`);

    if (errors.length > 0) {
        console.log('\n--- Errors ---');
        errors.forEach(e => console.log(`  • ${e}`));
    }

    console.log('\n═══════════════════════════════════════════════════════════════');

    if (successCount === courses.length) {
        console.log('🎉 All courses successfully migrated to production!');
    }
}

main().catch(console.error);
