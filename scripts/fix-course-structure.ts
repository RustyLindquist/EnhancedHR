/**
 * Fix Course Structure Script
 *
 * This script fixes the module and lesson structure for migrated courses by:
 * 1. Fetching the All Courses page to get actual WordPress URLs
 * 2. Fetching each course from WordPress to get the proper structure
 * 3. WordPress "Lessons" become our "Modules" with proper titles
 * 4. Videos within WordPress lessons become our "Lessons" with proper titles
 * 5. Activities that are forms are skipped
 *
 * IMPORTANT: This version preserves lessons by storing them first, then recreating.
 *
 * Usage: npx ts-node --compiler-options '{"module":"commonjs"}' scripts/fix-course-structure.ts [courseId]
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as http from 'http';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const LOCAL_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const LOCAL_SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const WP_ALL_COURSES_URL = 'http://localhost:3005/member-pages/all-courses/';

interface WPLessonStructure {
    lessonNumber: number;
    title: string;
    videos: string[];
}

interface ParsedCourseStructure {
    lessons: WPLessonStructure[];
}

interface LessonData {
    video_url: string | null;
    content: string | null;
    duration: number | null;
}

/**
 * Fetch HTML from URL
 */
async function fetchHTML(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
        http.get(url, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                const redirectUrl = response.headers.location;
                if (redirectUrl) {
                    fetchHTML(redirectUrl).then(resolve).catch(reject);
                    return;
                }
            }
            let data = '';
            response.on('data', chunk => data += chunk);
            response.on('end', () => resolve(data));
            response.on('error', reject);
        }).on('error', reject);
    });
}

/**
 * Extract course URLs from the All Courses page
 * Returns a map of normalized title -> WordPress URL
 */
function extractCourseUrls(html: string): Map<string, string> {
    const urlMap = new Map<string, string>();

    // Extract all titles from h2 elements with elementor-cta__title class
    // The content spans multiple lines, so use [\s\S]*? for non-greedy match
    const titles: { title: string; position: number }[] = [];
    const titleRegex = /<h2[^>]*class="[^"]*elementor-cta__title[^"]*"[^>]*>([\s\S]*?)<\/h2>/gi;
    let titleMatch;
    while ((titleMatch = titleRegex.exec(html)) !== null) {
        const title = titleMatch[1].trim().replace(/\s+/g, ' ');
        if (title.length > 2) {
            titles.push({ title, position: titleMatch.index });
        }
    }

    // Extract all academy URLs
    const urls: { url: string; position: number }[] = [];
    const urlRegex = /href="(http:\/\/localhost:3005\/[^"]*-academy\/[^"]+)"/gi;
    let urlMatch;
    while ((urlMatch = urlRegex.exec(html)) !== null) {
        urls.push({ url: urlMatch[1], position: urlMatch.index });
    }

    // Match titles with URLs - each title should have a URL following it
    for (const { title, position: titlePos } of titles) {
        // Find the next URL after this title
        const nextUrl = urls.find(u => u.position > titlePos);
        if (nextUrl) {
            // Make sure there's no other title between this title and the URL
            const hasIntermediateTitle = titles.some(t =>
                t.position > titlePos && t.position < nextUrl.position
            );
            if (!hasIntermediateTitle) {
                const normalizedTitle = normalizeTitle(title);
                urlMap.set(normalizedTitle, nextUrl.url);
            }
        }
    }

    return urlMap;
}

/**
 * Normalize title for matching
 */
function normalizeTitle(title: string): string {
    return title
        .toLowerCase()
        .replace(/[–—]/g, '-')
        .replace(/[()]/g, '')           // Remove parentheses
        .replace(/\s+/g, ' ')
        .replace(/part\s*(\d)/gi, 'part $1')
        .trim();
}

/**
 * Parse the course structure from WordPress HTML
 */
function parseCourseStructure(html: string): ParsedCourseStructure {
    const lessons: WPLessonStructure[] = [];

    // Extract all h2 elements content
    const h2Matches = html.matchAll(/<h2[^>]*>([^<]+)<\/h2>/gi);
    const headings: string[] = [];

    for (const match of h2Matches) {
        headings.push(match[1].trim());
    }

    // Parse the headings to extract lesson structure
    let currentLesson: WPLessonStructure | null = null;

    for (const heading of headings) {
        // Check if this is a Lesson header (with or without number)
        if (heading.match(/^Lesson(\s+\d+)?$/i)) {
            // Save previous lesson
            if (currentLesson) {
                lessons.push(currentLesson);
            }
            // Start new lesson - use number if present, otherwise use next available
            const numMatch = heading.match(/\d+/);
            const num = numMatch ? parseInt(numMatch[0]) : lessons.length + 1;
            currentLesson = {
                lessonNumber: num,
                title: '',
                videos: []
            };
            continue;
        }

        // If we have a current lesson, process the heading
        if (currentLesson) {
            // Skip activity and navigation items
            if (heading.toLowerCase().includes('activity')) continue;
            if (heading.match(/^(academy|rusty|author|paired|optimizing|founder|ceo)/i)) continue;
            if (heading.length < 3) continue;

            // First heading after lesson number is the lesson title (module name)
            if (!currentLesson.title) {
                currentLesson.title = heading;
            } else {
                // Subsequent headings are video titles
                currentLesson.videos.push(heading);
            }
        }
    }

    // Don't forget the last lesson
    if (currentLesson) {
        lessons.push(currentLesson);
    }

    return { lessons };
}


async function main() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('       FIX COURSE STRUCTURE (Modules & Lesson Titles)');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const supabase = createClient(LOCAL_SUPABASE_URL, LOCAL_SUPABASE_KEY);

    // Step 1: Fetch the All Courses page to get actual URLs
    console.log('📥 Fetching WordPress All Courses page...');
    const allCoursesHtml = await fetchHTML(WP_ALL_COURSES_URL);
    const wpUrlMap = extractCourseUrls(allCoursesHtml);
    console.log(`   Found ${wpUrlMap.size} course URLs\n`);

    // Check for command line arg
    const singleCourseId = process.argv[2] ? parseInt(process.argv[2]) : null;

    let query = supabase
        .from('courses')
        .select('id, title, category')
        .gte('id', 637)
        .lte('id', 681)
        .order('id');

    if (singleCourseId) {
        query = supabase
            .from('courses')
            .select('id, title, category')
            .eq('id', singleCourseId);
    }

    const { data: courses, error } = await query;

    if (error || !courses) {
        console.error('❌ Error fetching courses:', error);
        return;
    }

    console.log(`📦 Found ${courses.length} courses to process\n`);

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < courses.length; i++) {
        const course = courses[i];
        const progress = `[${i + 1}/${courses.length}]`;

        process.stdout.write(`${progress} "${course.title}"... `);

        try {
            // Find WordPress URL from the map
            const normalizedDbTitle = normalizeTitle(course.title);
            let wpUrl = wpUrlMap.get(normalizedDbTitle);

            // Try partial match if exact match fails
            if (!wpUrl) {
                for (const [wpTitle, url] of wpUrlMap) {
                    if (wpTitle.includes(normalizedDbTitle) || normalizedDbTitle.includes(wpTitle)) {
                        wpUrl = url;
                        break;
                    }
                }
            }

            if (!wpUrl) {
                console.log(`⚠️ No URL found in All Courses page`);
                errors.push(`${course.title}: No WordPress URL found`);
                errorCount++;
                continue;
            }

            // Fetch the WordPress page
            const html = await fetchHTML(wpUrl);

            if (html.includes('Page not found') || html.length < 1000) {
                console.log(`⚠️ Page not found`);
                errors.push(`${course.title}: Page not found at ${wpUrl}`);
                errorCount++;
                continue;
            }

            // Parse the structure
            const structure = parseCourseStructure(html);

            if (structure.lessons.length === 0) {
                console.log(`⚠️ No lessons found`);
                errors.push(`${course.title}: No lessons found`);
                errorCount++;
                continue;
            }

            // Get existing modules and lessons
            const { data: existingModules, error: modError } = await supabase
                .from('modules')
                .select('id')
                .eq('course_id', course.id);

            if (modError) {
                console.log(`⚠️ Module query error: ${modError.message}`);
                errors.push(`${course.title}: Module query error`);
                errorCount++;
                continue;
            }

            const moduleIds = existingModules?.map(m => m.id) || [];

            if (moduleIds.length === 0) {
                console.log(`⚠️ No modules found`);
                errors.push(`${course.title}: No modules found`);
                errorCount++;
                continue;
            }

            const { data: existingLessons, error: lessonError } = await supabase
                .from('lessons')
                .select('id, title, video_url, content, duration, "order"')
                .in('module_id', moduleIds)
                .order('order');

            if (lessonError) {
                console.log(`⚠️ Lesson query error: ${lessonError.message}`);
                errors.push(`${course.title}: Lesson query error`);
                errorCount++;
                continue;
            }

            if (!existingLessons || existingLessons.length === 0) {
                console.log(`⚠️ No existing lessons (modules: ${moduleIds.length})`);
                errors.push(`${course.title}: No existing lessons to update`);
                errorCount++;
                continue;
            }

            // Store lesson data for recreation
            const lessonData: LessonData[] = existingLessons.map(l => ({
                video_url: l.video_url,
                content: l.content,
                duration: l.duration
            }));

            // Build flat list of video titles from WordPress
            const wpVideoTitles: { moduleNum: number; moduleTitle: string; videoTitle: string }[] = [];

            for (const wpLesson of structure.lessons) {
                // Module title is also the first video
                wpVideoTitles.push({
                    moduleNum: wpLesson.lessonNumber,
                    moduleTitle: wpLesson.title,
                    videoTitle: wpLesson.title
                });
                // Subsequent videos
                for (const video of wpLesson.videos) {
                    wpVideoTitles.push({
                        moduleNum: wpLesson.lessonNumber,
                        moduleTitle: wpLesson.title,
                        videoTitle: video
                    });
                }
            }

            // Determine which module numbers will actually be used
            const lessonCount = Math.min(lessonData.length, wpVideoTitles.length);
            const usedModuleNums = new Set<number>();
            for (let j = 0; j < lessonCount; j++) {
                usedModuleNums.add(wpVideoTitles[j].moduleNum);
            }

            // Delete existing modules (lessons cascade delete)
            for (const moduleId of moduleIds) {
                await supabase.from('modules').delete().eq('id', moduleId);
            }

            // Create only modules that will have lessons
            const moduleMap = new Map<number, string>();
            let moduleOrder = 1;

            for (const wpLesson of structure.lessons) {
                if (!usedModuleNums.has(wpLesson.lessonNumber)) continue;

                const { data: newModule } = await supabase
                    .from('modules')
                    .insert({
                        course_id: course.id,
                        title: wpLesson.title,
                        order: moduleOrder++
                    })
                    .select()
                    .single();

                if (newModule) {
                    moduleMap.set(wpLesson.lessonNumber, newModule.id);
                }
            }

            // Recreate lessons with proper titles and module assignments
            let createdCount = 0;

            for (let j = 0; j < lessonCount; j++) {
                const data = lessonData[j];
                const wpVideo = wpVideoTitles[j];
                const moduleId = moduleMap.get(wpVideo.moduleNum);

                if (!moduleId) continue;

                // Calculate order within module
                const videosInModule = wpVideoTitles.slice(0, lessonCount).filter(v => v.moduleNum === wpVideo.moduleNum);
                const orderInModule = videosInModule.findIndex(v =>
                    v.videoTitle === wpVideo.videoTitle
                ) + 1;

                await supabase.from('lessons').insert({
                    module_id: moduleId,
                    title: wpVideo.videoTitle,
                    video_url: data.video_url,
                    content: data.content,
                    duration: data.duration,
                    order: orderInModule
                });

                createdCount++;
            }

            console.log(`✅ ${moduleMap.size} modules, ${createdCount} lessons`);
            successCount++;

        } catch (err: any) {
            console.log(`❌ ${err.message}`);
            errors.push(`${course.title}: ${err.message}`);
            errorCount++;
        }

        await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Summary
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('                        SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`✅ Successful: ${successCount}/${courses.length}`);
    console.log(`❌ Failed: ${errorCount}/${courses.length}`);

    if (errors.length > 0) {
        console.log('\n--- Errors ---');
        errors.slice(0, 10).forEach(e => console.log(`  • ${e}`));
        if (errors.length > 10) {
            console.log(`  ... and ${errors.length - 10} more`);
        }
    }

    console.log('\n═══════════════════════════════════════════════════════════════');
}

main().catch(console.error);
