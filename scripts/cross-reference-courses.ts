/**
 * Cross-Reference Courses Script
 *
 * Cross-references WordPress courses with EnhancedHR courses using YouTube video IDs.
 *
 * Nomenclature Mapping:
 * - WordPress "Course" -> EnhancedHR "Course"
 * - WordPress "Lesson" -> EnhancedHR "Module" (WP lesson title -> module title)
 * - WordPress "Video within lesson" -> EnhancedHR "Lesson" (video title -> lesson title)
 * - WordPress "Activity with video" -> EnhancedHR "Lesson"
 * - WordPress "Activity (form only)" -> Skip
 *
 * Usage: npx ts-node --compiler-options '{"module":"commonjs"}' scripts/cross-reference-courses.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as http from 'http';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const WP_ALL_COURSES_URL = 'http://localhost:3005/member-pages/all-courses/';

// Types
interface WPCourse {
    title: string;
    url: string;
    videoIds: string[];
    lessons: WPLesson[];
}

interface WPLesson {
    title: string;
    videos: WPVideo[];
}

interface WPVideo {
    title: string;
    videoId: string;
}

interface EHRCourse {
    id: number;
    title: string;
    modules: EHRModule[];
    videoIds: string[];
}

interface EHRModule {
    id: string;
    title: string;
    lessons: EHRLesson[];
}

interface EHRLesson {
    id: string;
    title: string;
    video_url: string | null;
    videoId: string | null;
}

type CourseStatus = 'CORRECT' | 'WRONG_TITLE' | 'DUPLICATE' | 'ORPHAN' | 'MIXED';

interface CourseReport {
    ehrCourseId: number;
    ehrTitle: string;
    status: CourseStatus;
    matchedWPCourse?: string;
    correctTitle?: string;
    confidence: number;
    matchingVideos: number;
    totalVideos: number;
    recommendation?: string;
}

interface DuplicateReport {
    wpCourse: string;
    ehrCourses: number[];
    recommendation: string;
}

interface OrphanReport {
    ehrCourseId: number;
    ehrTitle: string;
    recommendation: string;
}

interface IntegrityReport {
    timestamp: string;
    summary: {
        totalWPCourses: number;
        totalEHRCourses: number;
        correct: number;
        wrongTitle: number;
        duplicate: number;
        orphan: number;
        mixed: number;
    };
    courses: CourseReport[];
    duplicates: DuplicateReport[];
    orphans: OrphanReport[];
}

/**
 * Extract YouTube video ID from various URL formats
 */
function extractYouTubeVideoId(url: string): string | null {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }

    // Check if it's already just a video ID
    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
        return url;
    }

    return null;
}

/**
 * Fetch HTML from URL with redirect handling
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
 * Normalize title for matching
 */
function normalizeTitle(title: string): string {
    return title
        .toLowerCase()
        .replace(/[–—]/g, '-')
        .replace(/[()]/g, '')
        .replace(/\s+/g, ' ')
        .replace(/part\s*(\d)/gi, 'part $1')
        .replace(/&amp;/g, '&')
        .replace(/&#8217;/g, "'")
        .replace(/&#8216;/g, "'")
        .replace(/&#8220;/g, '"')
        .replace(/&#8221;/g, '"')
        .trim();
}

/**
 * Extract course URLs from the All Courses page
 */
function extractCourseUrls(html: string): Map<string, string> {
    const urlMap = new Map<string, string>();

    // Extract all titles from h2 elements with elementor-cta__title class
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

    // Also get individual-academy URLs (different pattern)
    const individualUrlRegex = /href="(http:\/\/localhost:3005\/individual-academy\/[^"]+)"/gi;
    let individualMatch: RegExpExecArray | null;
    while ((individualMatch = individualUrlRegex.exec(html)) !== null) {
        if (!urls.some(u => u.url === individualMatch![1])) {
            urls.push({ url: individualMatch[1], position: individualMatch.index });
        }
    }

    // Also get leadership-academy URLs
    const leadershipUrlRegex = /href="(http:\/\/localhost:3005\/leadership-academy\/[^"]+)"/gi;
    let leadershipMatch: RegExpExecArray | null;
    while ((leadershipMatch = leadershipUrlRegex.exec(html)) !== null) {
        if (!urls.some(u => u.url === leadershipMatch![1])) {
            urls.push({ url: leadershipMatch[1], position: leadershipMatch.index });
        }
    }

    // Match titles with URLs
    for (const { title, position: titlePos } of titles) {
        const nextUrl = urls.find(u => u.position > titlePos);
        if (nextUrl) {
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
 * Extract YouTube video IDs from WordPress course page HTML
 * Looks for video IDs in data-settings JSON attributes
 */
function extractVideoIdsFromHTML(html: string): string[] {
    const videoIds: string[] = [];

    // Pattern 1: YouTube URLs in data-settings JSON
    const dataSettingsRegex = /data-settings="([^"]+)"/gi;
    let match;
    while ((match = dataSettingsRegex.exec(html)) !== null) {
        const settings = match[1]
            .replace(/&quot;/g, '"')
            .replace(/&amp;/g, '&')
            .replace(/\\"/g, '"')
            .replace(/\\\//g, '/');

        // Look for youtube_url in the JSON
        const youtubeUrlMatch = settings.match(/youtube_url["\s:]+([^"]*youtu[^"]+)/i);
        if (youtubeUrlMatch) {
            const videoId = extractYouTubeVideoId(youtubeUrlMatch[1]);
            if (videoId && !videoIds.includes(videoId)) {
                videoIds.push(videoId);
            }
        }
    }

    // Pattern 2: Direct YouTube URLs in href or src attributes
    const directUrlRegex = /(youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/gi;
    while ((match = directUrlRegex.exec(html)) !== null) {
        const videoId = match[2];
        if (videoId && !videoIds.includes(videoId)) {
            videoIds.push(videoId);
        }
    }

    return videoIds;
}

/**
 * Parse WordPress course page to extract structure with video titles
 */
function parseWPCourseStructure(html: string, courseTitle: string): WPCourse {
    const lessons: WPLesson[] = [];
    const allVideoIds: string[] = [];

    // Extract all h2 headers
    const h2Matches = html.matchAll(/<h2[^>]*>([^<]+)<\/h2>/gi);
    const headings: string[] = [];
    for (const match of h2Matches) {
        headings.push(match[1].trim());
    }

    // Find video elements with their titles
    // Video titles are usually in h2 headers before/near the video widget
    const videoSections = html.split(/elementor-widget-video/gi);

    for (let i = 1; i < videoSections.length; i++) {
        const section = videoSections[i];
        const prevSection = videoSections[i - 1];

        // Extract video ID from this section
        const settingsMatch = section.match(/data-settings="([^"]+)"/i);
        if (settingsMatch) {
            const settings = settingsMatch[1]
                .replace(/&quot;/g, '"')
                .replace(/&amp;/g, '&')
                .replace(/\\\//g, '/');

            const youtubeUrlMatch = settings.match(/youtube_url["\s:]+([^"]*youtu[^"]+)/i);
            if (youtubeUrlMatch) {
                const videoId = extractYouTubeVideoId(youtubeUrlMatch[1]);
                if (videoId && !allVideoIds.includes(videoId)) {
                    allVideoIds.push(videoId);
                }
            }
        }
    }

    // Build simple structure based on video count
    const videoIds = extractVideoIdsFromHTML(html);

    return {
        title: courseTitle,
        url: '',
        videoIds: videoIds,
        lessons: lessons
    };
}

/**
 * Fetch all WordPress courses with their video IDs
 */
async function fetchWPCourses(): Promise<Map<string, WPCourse>> {
    const courses = new Map<string, WPCourse>();

    console.log('Fetching WordPress All Courses page...');
    const allCoursesHtml = await fetchHTML(WP_ALL_COURSES_URL);
    const urlMap = extractCourseUrls(allCoursesHtml);
    console.log(`Found ${urlMap.size} course URLs\n`);

    // Fetch each course page
    let processed = 0;
    for (const [normalizedTitle, url] of urlMap) {
        processed++;
        process.stdout.write(`[${processed}/${urlMap.size}] Fetching "${normalizedTitle.substring(0, 40)}"... `);

        try {
            const html = await fetchHTML(url);
            const videoIds = extractVideoIdsFromHTML(html);

            // Get the original title from the URL map key
            const wpCourse: WPCourse = {
                title: normalizedTitle,
                url: url,
                videoIds: videoIds,
                lessons: []
            };

            courses.set(normalizedTitle, wpCourse);
            console.log(`${videoIds.length} videos`);
        } catch (err) {
            console.log('FAILED');
        }

        // Small delay to avoid hammering the server
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    return courses;
}

/**
 * Fetch EnhancedHR courses from database
 */
async function fetchEHRCourses(): Promise<EHRCourse[]> {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const { data, error } = await supabase
        .from('courses')
        .select(`
            id,
            title,
            modules (
                id,
                title,
                order,
                lessons (
                    id,
                    title,
                    video_url,
                    order
                )
            )
        `)
        .gte('id', 616)
        .order('id');

    if (error || !data) {
        throw new Error(`Failed to fetch courses: ${error?.message}`);
    }

    return data.map(course => {
        const modules = (course.modules || [])
            .sort((a: any, b: any) => a.order - b.order)
            .map((m: any) => ({
                id: m.id,
                title: m.title,
                lessons: (m.lessons || [])
                    .sort((a: any, b: any) => a.order - b.order)
                    .map((l: any) => ({
                        id: l.id,
                        title: l.title,
                        video_url: l.video_url,
                        videoId: l.video_url ? extractYouTubeVideoId(l.video_url) : null
                    }))
            }));

        const videoIds = modules
            .flatMap((m: EHRModule) => m.lessons)
            .map((l: EHRLesson) => l.videoId)
            .filter((id: string | null): id is string => id !== null);

        return {
            id: course.id,
            title: course.title,
            modules,
            videoIds
        };
    });
}

/**
 * Build video ID to WordPress course mapping
 */
function buildVideoToCourseMap(wpCourses: Map<string, WPCourse>): Map<string, string[]> {
    const videoMap = new Map<string, string[]>();

    for (const [normalizedTitle, course] of wpCourses) {
        for (const videoId of course.videoIds) {
            if (!videoMap.has(videoId)) {
                videoMap.set(videoId, []);
            }
            videoMap.get(videoId)!.push(normalizedTitle);
        }
    }

    return videoMap;
}

/**
 * Cross-reference EHR course against WordPress courses
 */
function crossReferenceCourse(
    ehrCourse: EHRCourse,
    wpCourses: Map<string, WPCourse>,
    videoToWPCourse: Map<string, string[]>
): CourseReport {
    const ehrVideoIds = ehrCourse.videoIds;
    const totalVideos = ehrVideoIds.length;

    if (totalVideos === 0) {
        return {
            ehrCourseId: ehrCourse.id,
            ehrTitle: ehrCourse.title,
            status: 'ORPHAN',
            confidence: 0,
            matchingVideos: 0,
            totalVideos: 0,
            recommendation: 'DELETE - no videos found'
        };
    }

    // Count votes for each WP course based on video matches
    const votes = new Map<string, number>();

    for (const videoId of ehrVideoIds) {
        const wpCourseMatches = videoToWPCourse.get(videoId);
        if (wpCourseMatches) {
            for (const wpCourse of wpCourseMatches) {
                votes.set(wpCourse, (votes.get(wpCourse) || 0) + 1);
            }
        }
    }

    if (votes.size === 0) {
        return {
            ehrCourseId: ehrCourse.id,
            ehrTitle: ehrCourse.title,
            status: 'ORPHAN',
            confidence: 0,
            matchingVideos: 0,
            totalVideos,
            recommendation: 'DELETE - no WordPress match'
        };
    }

    // Find the winner
    let maxVotes = 0;
    let winner: string | null = null;
    let runnerUp = 0;

    for (const [wpCourse, voteCount] of votes) {
        if (voteCount > maxVotes) {
            runnerUp = maxVotes;
            maxVotes = voteCount;
            winner = wpCourse;
        } else if (voteCount > runnerUp) {
            runnerUp = voteCount;
        }
    }

    const confidence = Math.round((maxVotes / totalVideos) * 100);
    const normalizedEHRTitle = normalizeTitle(ehrCourse.title);

    // Determine status
    if (confidence < 50 && runnerUp > 0 && maxVotes - runnerUp <= 2) {
        // Videos from multiple courses with no clear winner
        return {
            ehrCourseId: ehrCourse.id,
            ehrTitle: ehrCourse.title,
            status: 'MIXED',
            matchedWPCourse: winner!,
            confidence,
            matchingVideos: maxVotes,
            totalVideos,
            recommendation: `REVIEW - videos from multiple courses (${Array.from(votes.keys()).join(', ')})`
        };
    }

    // Check if titles match
    const titlesMatch = normalizedEHRTitle === winner ||
        normalizedEHRTitle.includes(winner!) ||
        winner!.includes(normalizedEHRTitle);

    if (titlesMatch) {
        return {
            ehrCourseId: ehrCourse.id,
            ehrTitle: ehrCourse.title,
            status: 'CORRECT',
            matchedWPCourse: winner!,
            confidence,
            matchingVideos: maxVotes,
            totalVideos
        };
    } else {
        return {
            ehrCourseId: ehrCourse.id,
            ehrTitle: ehrCourse.title,
            status: 'WRONG_TITLE',
            matchedWPCourse: winner!,
            correctTitle: winner!,
            confidence,
            matchingVideos: maxVotes,
            totalVideos,
            recommendation: `UPDATE title to '${winner}'`
        };
    }
}

/**
 * Find duplicate courses (multiple EHR courses matching same WP course)
 */
function findDuplicates(reports: CourseReport[], ehrCourses: EHRCourse[]): DuplicateReport[] {
    const wpToEHR = new Map<string, number[]>();

    for (const report of reports) {
        if (report.matchedWPCourse && (report.status === 'CORRECT' || report.status === 'WRONG_TITLE')) {
            if (!wpToEHR.has(report.matchedWPCourse)) {
                wpToEHR.set(report.matchedWPCourse, []);
            }
            wpToEHR.get(report.matchedWPCourse)!.push(report.ehrCourseId);
        }
    }

    const duplicates: DuplicateReport[] = [];

    for (const [wpCourse, ehrIds] of wpToEHR) {
        if (ehrIds.length > 1) {
            // Find which course has more modules/lessons
            const courseInfo = ehrIds.map(id => {
                const course = ehrCourses.find(c => c.id === id)!;
                const moduleCount = course.modules.length;
                const lessonCount = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
                return { id, moduleCount, lessonCount };
            });

            courseInfo.sort((a, b) => b.lessonCount - a.lessonCount || b.moduleCount - a.moduleCount);
            const keep = courseInfo[0];
            const deleteIds = courseInfo.slice(1).map(c => c.id);

            duplicates.push({
                wpCourse,
                ehrCourses: ehrIds,
                recommendation: `Keep ${keep.id} (${keep.moduleCount} modules, ${keep.lessonCount} lessons), delete ${deleteIds.join(', ')}`
            });
        }
    }

    return duplicates;
}

async function main() {
    console.log('='.repeat(65));
    console.log('    COURSE CROSS-REFERENCE INTEGRITY CHECK');
    console.log('='.repeat(65));
    console.log();

    // Step 1: Fetch WordPress courses
    console.log('STEP 1: Fetching WordPress courses...');
    console.log('-'.repeat(65));
    const wpCourses = await fetchWPCourses();
    console.log();

    // Step 2: Fetch EnhancedHR courses
    console.log('STEP 2: Fetching EnhancedHR courses...');
    console.log('-'.repeat(65));
    const ehrCourses = await fetchEHRCourses();
    console.log(`Found ${ehrCourses.length} courses with ID >= 616`);
    console.log();

    // Step 3: Build video mapping
    console.log('STEP 3: Building video-to-course mapping...');
    console.log('-'.repeat(65));
    const videoToWPCourse = buildVideoToCourseMap(wpCourses);
    console.log(`Mapped ${videoToWPCourse.size} unique video IDs`);
    console.log();

    // Step 4: Cross-reference each EHR course
    console.log('STEP 4: Cross-referencing courses...');
    console.log('-'.repeat(65));

    const reports: CourseReport[] = [];

    for (const ehrCourse of ehrCourses) {
        const report = crossReferenceCourse(ehrCourse, wpCourses, videoToWPCourse);
        reports.push(report);

        const statusIcon = {
            'CORRECT': '[OK]',
            'WRONG_TITLE': '[!!]',
            'DUPLICATE': '[DUP]',
            'ORPHAN': '[---]',
            'MIXED': '[MIX]'
        }[report.status];

        console.log(`${statusIcon} ${ehrCourse.id}: "${ehrCourse.title.substring(0, 35)}" -> ${report.matchedWPCourse || 'NO MATCH'} (${report.confidence}%)`);
    }
    console.log();

    // Step 5: Find duplicates
    console.log('STEP 5: Identifying duplicates...');
    console.log('-'.repeat(65));
    const duplicates = findDuplicates(reports, ehrCourses);

    // Mark duplicate courses in reports
    for (const dup of duplicates) {
        for (const courseId of dup.ehrCourses.slice(1)) {
            const report = reports.find(r => r.ehrCourseId === courseId);
            if (report) {
                report.status = 'DUPLICATE';
            }
        }
    }

    console.log(`Found ${duplicates.length} duplicate course groups`);
    console.log();

    // Step 6: Generate summary
    const summary = {
        totalWPCourses: wpCourses.size,
        totalEHRCourses: ehrCourses.length,
        correct: reports.filter(r => r.status === 'CORRECT').length,
        wrongTitle: reports.filter(r => r.status === 'WRONG_TITLE').length,
        duplicate: reports.filter(r => r.status === 'DUPLICATE').length,
        orphan: reports.filter(r => r.status === 'ORPHAN').length,
        mixed: reports.filter(r => r.status === 'MIXED').length
    };

    const orphans: OrphanReport[] = reports
        .filter(r => r.status === 'ORPHAN')
        .map(r => ({
            ehrCourseId: r.ehrCourseId,
            ehrTitle: r.ehrTitle,
            recommendation: r.recommendation || 'DELETE - no WordPress match'
        }));

    // Build final report
    const integrityReport: IntegrityReport = {
        timestamp: new Date().toISOString(),
        summary,
        courses: reports,
        duplicates,
        orphans
    };

    // Save report to JSON
    const reportPath = path.resolve(__dirname, '../.context/integrity-report.json');
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(integrityReport, null, 2));
    console.log(`Report saved to: ${reportPath}`);
    console.log();

    // Print human-readable summary
    console.log('='.repeat(65));
    console.log('                        SUMMARY');
    console.log('='.repeat(65));
    console.log();
    console.log(`WordPress Courses:    ${summary.totalWPCourses}`);
    console.log(`EnhancedHR Courses:   ${summary.totalEHRCourses}`);
    console.log();
    console.log(`[OK]  Correct:        ${summary.correct}`);
    console.log(`[!!]  Wrong Title:    ${summary.wrongTitle}`);
    console.log(`[DUP] Duplicate:      ${summary.duplicate}`);
    console.log(`[---] Orphan:         ${summary.orphan}`);
    console.log(`[MIX] Mixed:          ${summary.mixed}`);
    console.log();

    if (summary.wrongTitle > 0) {
        console.log('-'.repeat(65));
        console.log('COURSES NEEDING TITLE UPDATE:');
        console.log('-'.repeat(65));
        reports
            .filter(r => r.status === 'WRONG_TITLE')
            .forEach(r => {
                console.log(`  ${r.ehrCourseId}: "${r.ehrTitle}" -> "${r.correctTitle}"`);
            });
        console.log();
    }

    if (duplicates.length > 0) {
        console.log('-'.repeat(65));
        console.log('DUPLICATE COURSES:');
        console.log('-'.repeat(65));
        duplicates.forEach(d => {
            console.log(`  "${d.wpCourse}": EHR IDs ${d.ehrCourses.join(', ')}`);
            console.log(`    -> ${d.recommendation}`);
        });
        console.log();
    }

    if (orphans.length > 0) {
        console.log('-'.repeat(65));
        console.log('ORPHAN COURSES (no WordPress match):');
        console.log('-'.repeat(65));
        orphans.forEach(o => {
            console.log(`  ${o.ehrCourseId}: "${o.ehrTitle}"`);
        });
        console.log();
    }

    console.log('='.repeat(65));
    console.log('Cross-reference complete.');
    console.log('='.repeat(65));
}

main().catch(console.error);
