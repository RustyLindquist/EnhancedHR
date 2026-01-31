/**
 * Course Image Migration Script
 *
 * Migrates course featured images from WordPress (localhost:3005) to Supabase Storage.
 * Downloads images locally and sends them as base64 to the production API.
 *
 * Usage: npx ts-node --compiler-options '{"module":"commonjs"}' scripts/migrate-course-images.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const LOCAL_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const LOCAL_SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const PROD_URL = process.env.PROD_APP_URL!;
const SECRET_KEY = process.env.COURSE_IMPORT_SECRET!;

// Course ID mapping: local ID -> production ID
// Based on the promotion results: local 637 -> prod 627, etc.
const LOCAL_START = 637;
const PROD_START = 627;

/**
 * Download an image from a URL and return as Buffer
 */
async function downloadImage(url: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;

        protocol.get(url, (response) => {
            // Handle redirects
            if (response.statusCode === 301 || response.statusCode === 302) {
                const redirectUrl = response.headers.location;
                if (redirectUrl) {
                    downloadImage(redirectUrl).then(resolve).catch(reject);
                    return;
                }
            }

            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download: ${response.statusCode}`));
                return;
            }

            const chunks: Buffer[] = [];
            response.on('data', (chunk) => chunks.push(chunk));
            response.on('end', () => resolve(Buffer.concat(chunks)));
            response.on('error', reject);
        }).on('error', reject);
    });
}

/**
 * Get content type from URL/filename
 */
function getContentType(url: string): string {
    const ext = url.split('.').pop()?.toLowerCase().split('?')[0];
    const types: Record<string, string> = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'webp': 'image/webp',
        'gif': 'image/gif',
    };
    return types[ext || ''] || 'image/jpeg';
}

/**
 * Get file extension from URL
 */
function getExtension(url: string): string {
    const ext = url.split('.').pop()?.toLowerCase().split('?')[0];
    return ext || 'jpg';
}

/**
 * Send image to production API
 */
async function sendImageToProduction(
    courseId: number,
    imageBuffer: Buffer,
    contentType: string,
    extension: string
): Promise<{ success: boolean; newImageUrl?: string; error?: string }> {
    const base64Data = imageBuffer.toString('base64');

    const response = await fetch(`${PROD_URL}/api/course-import/images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            courseId,
            imageData: base64Data,
            contentType,
            extension,
            secretKey: SECRET_KEY,
        }),
    });

    const result = await response.json();

    if (!result.success) {
        return { success: false, error: result.error };
    }

    return { success: true, newImageUrl: result.newImageUrl };
}

async function main() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('         COURSE IMAGE MIGRATION TO SUPABASE STORAGE');
    console.log('═══════════════════════════════════════════════════════════════\n');

    if (!PROD_URL || !SECRET_KEY) {
        console.error('❌ Missing PROD_APP_URL or COURSE_IMPORT_SECRET');
        process.exit(1);
    }

    const localSupabase = createClient(LOCAL_SUPABASE_URL, LOCAL_SUPABASE_KEY);

    // Fetch courses with WordPress image URLs
    const { data: courses, error } = await localSupabase
        .from('courses')
        .select('id, title, image_url')
        .gte('id', LOCAL_START)
        .lte('id', 681)
        .like('image_url', '%localhost:3005%')
        .order('id');

    if (error) {
        console.error('❌ Error fetching courses:', error.message);
        process.exit(1);
    }

    if (!courses || courses.length === 0) {
        console.log('✅ No courses with WordPress image URLs found. Already migrated?');
        process.exit(0);
    }

    console.log(`Target: ${PROD_URL}`);
    console.log(`📦 Found ${courses.length} courses with WordPress images to migrate\n`);

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];
    const migrated: { localId: number; prodId: number; title: string; newUrl: string }[] = [];

    for (let i = 0; i < courses.length; i++) {
        const course = courses[i];
        const prodId = course.id - LOCAL_START + PROD_START;
        const progress = `[${i + 1}/${courses.length}]`;

        process.stdout.write(`${progress} "${course.title}" (local:${course.id} → prod:${prodId})... `);

        try {
            // Download image from WordPress (localhost)
            const imageBuffer = await downloadImage(course.image_url);

            const ext = getExtension(course.image_url);
            const contentType = getContentType(course.image_url);

            // Send to production API
            const result = await sendImageToProduction(prodId, imageBuffer, contentType, ext);

            if (!result.success) {
                throw new Error(result.error || 'Unknown error');
            }

            // Update local course record with new URL
            if (result.newImageUrl) {
                await localSupabase
                    .from('courses')
                    .update({ image_url: result.newImageUrl })
                    .eq('id', course.id);

                migrated.push({
                    localId: course.id,
                    prodId,
                    title: course.title,
                    newUrl: result.newImageUrl
                });
            }

            console.log('✅');
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

    if (successCount > 0) {
        console.log('✅ Images are now served from Supabase Storage on production!');
        console.log(`📍 Sample URL: ${migrated[0]?.newUrl || 'N/A'}`);
    }
}

main().catch(console.error);
