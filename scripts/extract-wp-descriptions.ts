/**
 * Extract Course Descriptions from WordPress
 *
 * Fetches the WordPress All Courses page and extracts course descriptions.
 * Then updates local and production databases.
 *
 * Usage: npx ts-node --compiler-options '{"module":"commonjs"}' scripts/extract-wp-descriptions.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const LOCAL_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const LOCAL_SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const PROD_URL = process.env.PROD_APP_URL!;
const SECRET_KEY = process.env.COURSE_IMPORT_SECRET!;

const WP_ALL_COURSES_URL = 'http://localhost:3005/member-pages/all-courses/';

// Course ID mapping: local ID -> production ID
const LOCAL_START = 637;
const PROD_START = 627;

/**
 * Fetch HTML from URL
 */
async function fetchHTML(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
        http.get(url, (response) => {
            let data = '';
            response.on('data', chunk => data += chunk);
            response.on('end', () => resolve(data));
            response.on('error', reject);
        }).on('error', reject);
    });
}

/**
 * Parse course descriptions from WordPress HTML
 *
 * Structure:
 * - elementor-cta__title contains the title
 * - elementor-cta__description contains <p> tags
 *   - First <p> with <em> is the tagline
 *   - Subsequent <p> tags are the description
 */
function parseCourseDescriptions(html: string): Map<string, string> {
    const descriptions = new Map<string, string>();

    // Split by "Launch Course" to get each course card section
    const sections = html.split(/Launch Course/i);

    sections.forEach((section, index) => {
        if (index === sections.length - 1) return;

        // Extract title from h2 with elementor-cta__title class
        // The title is inside the h2 tag with potential whitespace/newlines
        const titleMatch = section.match(/<h2[^>]*elementor-cta__title[^>]*>([\s\S]*?)<\/h2>/i);

        if (!titleMatch) return;

        let title = titleMatch[1].trim();
        // Normalize whitespace
        title = title.replace(/\s+/g, ' ');

        // Find the description section (div with elementor-cta__description class)
        const descMatch = section.match(/<div[^>]*elementor-cta__description[^>]*>([\s\S]*?)<\/div>/i);
        if (!descMatch) return;

        const descSection = descMatch[1];

        // Extract all paragraph content (including those with nested tags like <em>)
        const paragraphs: string[] = [];
        const pMatches = descSection.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi);

        for (const match of pMatches) {
            // Remove HTML tags and get plain text
            let text = match[1]
                .replace(/<[^>]+>/g, '')  // Remove HTML tags
                .replace(/&nbsp;/g, ' ')   // Replace nbsp
                .replace(/&#8217;/g, "'")  // Smart apostrophe
                .replace(/&#8216;/g, "'")  // Smart single quote
                .replace(/&#8220;/g, '"')  // Smart double quote open
                .replace(/&#8221;/g, '"')  // Smart double quote close
                .replace(/&#8230;/g, '...') // Ellipsis
                .replace(/&amp;/g, '&')    // Ampersand
                .replace(/\s+/g, ' ')      // Normalize whitespace
                .trim();

            if (text.length > 10) {
                paragraphs.push(text);
            }
        }

        // Usually first paragraph is tagline (short), rest is description
        // If only one paragraph and it's substantial, use it as description
        let description = '';
        if (paragraphs.length >= 2) {
            // Skip first (tagline) and join the rest
            description = paragraphs.slice(1).join(' ');
        } else if (paragraphs.length === 1 && paragraphs[0].length > 50) {
            description = paragraphs[0];
        }

        if (description && title) {
            descriptions.set(title, description);
        }
    });

    return descriptions;
}

/**
 * Normalize title for matching (handles variations like Part 1 vs Part 1)
 */
function normalizeTitle(title: string): string {
    return title
        .toLowerCase()
        .replace(/[–—]/g, '-')  // Normalize dashes
        .replace(/\s+/g, ' ')    // Normalize whitespace
        .replace(/part\s*(\d)/gi, 'part $1')  // Normalize "Part1" to "Part 1"
        .trim();
}

async function main() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('    COURSE DESCRIPTION UPDATE FROM WORDPRESS');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const localSupabase = createClient(LOCAL_SUPABASE_URL, LOCAL_SUPABASE_KEY);

    // Step 1: Fetch WordPress page
    console.log('📥 Fetching WordPress All Courses page...');
    const html = await fetchHTML(WP_ALL_COURSES_URL);
    console.log(`   Downloaded ${(html.length / 1024).toFixed(1)} KB of HTML\n`);

    // Step 2: Parse descriptions
    console.log('🔍 Parsing course descriptions...');
    const wpDescriptions = parseCourseDescriptions(html);
    console.log(`   Found ${wpDescriptions.size} course descriptions\n`);

    // Step 3: Get local courses
    const { data: localCourses, error } = await localSupabase
        .from('courses')
        .select('id, title, description')
        .gte('id', LOCAL_START)
        .lte('id', 681)
        .order('id');

    if (error || !localCourses) {
        console.error('❌ Error fetching local courses:', error);
        return;
    }

    console.log(`📦 Found ${localCourses.length} local courses to check\n`);

    // Step 4: Match and identify updates needed
    const updates: { localId: number; prodId: number; title: string; oldDesc: string; newDesc: string }[] = [];

    for (const course of localCourses) {
        const normalizedDbTitle = normalizeTitle(course.title);

        // Try to find matching WordPress description
        let wpDesc: string | undefined;
        for (const [wpTitle, desc] of wpDescriptions) {
            if (normalizeTitle(wpTitle) === normalizedDbTitle) {
                wpDesc = desc;
                break;
            }
        }

        if (!wpDesc) {
            // Try partial matching
            for (const [wpTitle, desc] of wpDescriptions) {
                const normWp = normalizeTitle(wpTitle);
                if (normWp.includes(normalizedDbTitle) || normalizedDbTitle.includes(normWp)) {
                    wpDesc = desc;
                    break;
                }
            }
        }

        if (wpDesc && wpDesc !== course.description) {
            // Check if the current description is a generic placeholder
            const isGeneric = course.description?.startsWith('Learn ') ||
                             course.description?.startsWith('Discover ') ||
                             course.description?.startsWith('Explore ') ||
                             course.description?.startsWith('Master ') ||
                             course.description?.startsWith('Understand ') ||
                             course.description?.includes('This is Part') ||
                             !course.description;

            if (isGeneric || wpDesc.length > (course.description?.length || 0)) {
                updates.push({
                    localId: course.id,
                    prodId: course.id - LOCAL_START + PROD_START,
                    title: course.title,
                    oldDesc: course.description || '(empty)',
                    newDesc: wpDesc
                });
            }
        }
    }

    console.log(`🔄 Found ${updates.length} courses needing description updates\n`);

    if (updates.length === 0) {
        console.log('✅ All course descriptions are already up to date!');
        return;
    }

    // Show preview
    console.log('Preview of updates:');
    console.log('─'.repeat(60));
    updates.slice(0, 5).forEach(u => {
        console.log(`\n📖 ${u.title}`);
        console.log(`   OLD: ${u.oldDesc.substring(0, 60)}...`);
        console.log(`   NEW: ${u.newDesc.substring(0, 60)}...`);
    });
    if (updates.length > 5) {
        console.log(`\n   ... and ${updates.length - 5} more`);
    }
    console.log('\n' + '─'.repeat(60));

    // Step 5: Update local database
    console.log('\n📝 Updating local database...');
    let localSuccess = 0;
    for (const update of updates) {
        const { error } = await localSupabase
            .from('courses')
            .update({ description: update.newDesc })
            .eq('id', update.localId);

        if (!error) localSuccess++;
    }
    console.log(`   ✅ Updated ${localSuccess}/${updates.length} local courses`);

    // Step 6: Update production database via API
    console.log('\n🚀 Updating production database...');
    let prodSuccess = 0;
    for (const update of updates) {
        try {
            const response = await fetch(`${PROD_URL}/api/course-import/update-description`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    courseId: update.prodId,
                    description: update.newDesc,
                    secretKey: SECRET_KEY,
                }),
            });

            const result = await response.json();
            if (result.success) {
                prodSuccess++;
                process.stdout.write('.');
            } else {
                process.stdout.write('x');
            }
        } catch (err) {
            process.stdout.write('x');
        }
    }
    console.log(`\n   ✅ Updated ${prodSuccess}/${updates.length} production courses`);

    // Summary
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('                        SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`✅ Local updates: ${localSuccess}/${updates.length}`);
    console.log(`✅ Production updates: ${prodSuccess}/${updates.length}`);
    console.log('═══════════════════════════════════════════════════════════════\n');
}

main().catch(console.error);
