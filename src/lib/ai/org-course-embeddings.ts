'use server';

/**
 * Organization Course Embeddings Service
 *
 * Generates and stores embeddings for organization courses in the unified_embeddings table.
 * These embeddings are org-scoped - they can ONLY be accessed by members of that organization.
 *
 * Key invariants:
 * 1. org_id MUST be set for all org course embeddings
 * 2. Embeddings are created when a course is published
 * 3. Embeddings are deleted when a course is unpublished
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { generateEmbedding } from '@/lib/ai/embedding';
import { chunkText } from '@/lib/file-parser';

/**
 * Result of embedding generation operations
 */
export interface EmbeddingResult {
    success: boolean;
    embeddingCount: number;
    error?: string;
}

/**
 * Generate and store embeddings for a published org course.
 * Extracts content from: course title, description, modules, and lessons.
 *
 * @param courseId - The course ID to generate embeddings for
 * @param orgId - The organization ID (MUST be set for org-scoped access)
 * @returns Result with success status and number of embeddings created
 */
export async function generateOrgCourseEmbeddings(
    courseId: number,
    orgId: string
): Promise<EmbeddingResult> {
    const admin = createAdminClient();

    try {
        console.log(`[OrgCourseEmbeddings] Generating embeddings for course ${courseId} in org ${orgId}`);

        // First, delete any existing embeddings for this course
        await deleteOrgCourseEmbeddings(courseId);

        // Fetch course with modules and lessons
        const { data: course, error: courseError } = await admin
            .from('courses')
            .select(`
                id,
                title,
                description,
                category,
                author,
                modules (
                    id,
                    title,
                    description,
                    order,
                    lessons (
                        id,
                        title,
                        description,
                        transcript,
                        order
                    )
                )
            `)
            .eq('id', courseId)
            .single();

        if (courseError || !course) {
            console.error('[OrgCourseEmbeddings] Error fetching course:', courseError);
            return { success: false, embeddingCount: 0, error: courseError?.message || 'Course not found' };
        }

        let totalEmbeddings = 0;
        const embedPromises: Promise<number>[] = [];

        // 1. Embed course overview
        const courseOverview = buildCourseOverviewText(course);
        if (courseOverview.trim()) {
            embedPromises.push(
                createEmbeddingsForContent(
                    admin,
                    `course-${courseId}`,
                    courseId,
                    orgId,
                    courseOverview,
                    {
                        type: 'course_overview',
                        course_title: course.title,
                        category: course.category,
                        author: course.author
                    }
                )
            );
        }

        // 2. Embed each module and its lessons
        const modules = course.modules || [];
        for (const module of modules) {
            // Module content
            const moduleText = buildModuleText(course.title, module);
            if (moduleText.trim()) {
                embedPromises.push(
                    createEmbeddingsForContent(
                        admin,
                        `module-${module.id}`,
                        courseId,
                        orgId,
                        moduleText,
                        {
                            type: 'module',
                            course_title: course.title,
                            module_title: module.title,
                            module_order: module.order
                        }
                    )
                );
            }

            // Lesson content
            const lessons = module.lessons || [];
            for (const lesson of lessons) {
                const lessonText = buildLessonText(course.title, module.title, lesson);
                if (lessonText.trim()) {
                    embedPromises.push(
                        createEmbeddingsForContent(
                            admin,
                            `lesson-${lesson.id}`,
                            courseId,
                            orgId,
                            lessonText,
                            {
                                type: 'lesson',
                                course_title: course.title,
                                module_title: module.title,
                                lesson_title: lesson.title,
                                lesson_order: lesson.order,
                                has_transcript: !!lesson.transcript
                            }
                        )
                    );
                }
            }
        }

        // Wait for all embeddings to be created
        const results = await Promise.all(embedPromises);
        totalEmbeddings = results.reduce((sum, count) => sum + count, 0);

        console.log(`[OrgCourseEmbeddings] Created ${totalEmbeddings} embeddings for course ${courseId}`);
        return { success: true, embeddingCount: totalEmbeddings };

    } catch (error) {
        console.error('[OrgCourseEmbeddings] Error generating embeddings:', error);
        return {
            success: false,
            embeddingCount: 0,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Delete all embeddings for an org course.
 * Called when a course is unpublished or before regenerating embeddings.
 *
 * @param courseId - The course ID to delete embeddings for
 * @returns Result with success status and number of embeddings deleted
 */
export async function deleteOrgCourseEmbeddings(
    courseId: number
): Promise<{ success: boolean; deletedCount: number; error?: string }> {
    const admin = createAdminClient();

    try {
        // Delete all embeddings with source_type 'org_course' and matching course_id
        const { data, error } = await admin
            .from('unified_embeddings')
            .delete()
            .eq('course_id', courseId)
            .eq('source_type', 'org_course')
            .select('id');

        if (error) {
            console.error('[OrgCourseEmbeddings] Error deleting embeddings:', error);
            return { success: false, deletedCount: 0, error: error.message };
        }

        const deletedCount = data?.length || 0;
        console.log(`[OrgCourseEmbeddings] Deleted ${deletedCount} embeddings for course ${courseId}`);
        return { success: true, deletedCount };

    } catch (error) {
        console.error('[OrgCourseEmbeddings] Error in deleteOrgCourseEmbeddings:', error);
        return {
            success: false,
            deletedCount: 0,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Build text representation of course overview for embedding
 */
function buildCourseOverviewText(course: {
    title: string;
    description?: string | null;
    category?: string | null;
    author?: string | null;
}): string {
    const parts: string[] = [];

    parts.push(`Course: ${course.title}`);

    if (course.category) {
        parts.push(`Category: ${course.category}`);
    }

    if (course.author) {
        parts.push(`Instructor: ${course.author}`);
    }

    if (course.description) {
        parts.push(`\nCourse Description:\n${course.description}`);
    }

    return parts.join('\n');
}

/**
 * Build text representation of a module for embedding
 */
function buildModuleText(
    courseTitle: string,
    module: {
        title: string;
        description?: string | null;
        order?: number;
    }
): string {
    const parts: string[] = [];

    parts.push(`Course: ${courseTitle}`);
    parts.push(`Module: ${module.title}`);

    if (module.description) {
        parts.push(`\nModule Description:\n${module.description}`);
    }

    return parts.join('\n');
}

/**
 * Build text representation of a lesson for embedding
 */
function buildLessonText(
    courseTitle: string,
    moduleTitle: string,
    lesson: {
        title: string;
        description?: string | null;
        transcript?: string | null;
        order?: number;
    }
): string {
    const parts: string[] = [];

    parts.push(`Course: ${courseTitle}`);
    parts.push(`Module: ${moduleTitle}`);
    parts.push(`Lesson: ${lesson.title}`);

    if (lesson.description) {
        parts.push(`\nLesson Description:\n${lesson.description}`);
    }

    if (lesson.transcript) {
        parts.push(`\nLesson Content:\n${lesson.transcript}`);
    }

    return parts.join('\n');
}

/**
 * Create embeddings for content, handling chunking for long content.
 * Returns the number of embeddings created.
 */
async function createEmbeddingsForContent(
    admin: ReturnType<typeof createAdminClient>,
    sourceId: string,
    courseId: number,
    orgId: string,
    content: string,
    metadata: Record<string, any>
): Promise<number> {
    // Don't embed empty content
    if (!content || content.trim().length === 0) {
        return 0;
    }

    // Chunk content if it's long
    const chunks = content.length > 1200 ? chunkText(content, 1000, 200) : [content];

    let embeddingCount = 0;

    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const embedding = await generateEmbedding(chunk);

        if (!embedding || embedding.length === 0) {
            console.warn(`[OrgCourseEmbeddings] Failed to generate embedding for chunk ${i + 1}/${chunks.length}`);
            continue;
        }

        const { error } = await admin
            .from('unified_embeddings')
            .insert({
                user_id: null, // Org course content is not user-specific
                course_id: courseId,
                org_id: orgId,
                collection_id: null,
                source_type: 'org_course',
                source_id: sourceId,
                content: chunk,
                embedding: embedding,
                metadata: {
                    ...metadata,
                    chunk_index: i,
                    total_chunks: chunks.length
                }
            });

        if (error) {
            console.error(`[OrgCourseEmbeddings] Error inserting embedding:`, error);
        } else {
            embeddingCount++;
        }
    }

    return embeddingCount;
}

/**
 * Check if embeddings exist for an org course
 */
export async function hasOrgCourseEmbeddings(
    courseId: number
): Promise<boolean> {
    const admin = createAdminClient();

    const { count, error } = await admin
        .from('unified_embeddings')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', courseId)
        .eq('source_type', 'org_course')
        .limit(1);

    if (error) {
        console.error('[OrgCourseEmbeddings] Error checking embeddings:', error);
        return false;
    }

    return (count || 0) > 0;
}

/**
 * Regenerate embeddings for all published org courses in an organization.
 * Useful for batch re-indexing or after model changes.
 */
export async function regenerateAllOrgCourseEmbeddings(
    orgId: string
): Promise<{ success: boolean; coursesProcessed: number; totalEmbeddings: number; errors: string[] }> {
    const admin = createAdminClient();
    const errors: string[] = [];
    let totalEmbeddings = 0;

    try {
        // Fetch all published org courses
        const { data: courses, error } = await admin
            .from('courses')
            .select('id')
            .eq('org_id', orgId)
            .eq('status', 'published');

        if (error) {
            return {
                success: false,
                coursesProcessed: 0,
                totalEmbeddings: 0,
                errors: [error.message]
            };
        }

        if (!courses || courses.length === 0) {
            return {
                success: true,
                coursesProcessed: 0,
                totalEmbeddings: 0,
                errors: []
            };
        }

        // Process each course
        for (const course of courses) {
            const result = await generateOrgCourseEmbeddings(course.id, orgId);

            if (result.success) {
                totalEmbeddings += result.embeddingCount;
            } else if (result.error) {
                errors.push(`Course ${course.id}: ${result.error}`);
            }
        }

        console.log(`[OrgCourseEmbeddings] Regenerated embeddings for ${courses.length} courses, total ${totalEmbeddings} embeddings`);

        return {
            success: errors.length === 0,
            coursesProcessed: courses.length,
            totalEmbeddings,
            errors
        };

    } catch (error) {
        console.error('[OrgCourseEmbeddings] Error in regenerateAllOrgCourseEmbeddings:', error);
        return {
            success: false,
            coursesProcessed: 0,
            totalEmbeddings: 0,
            errors: [error instanceof Error ? error.message : 'Unknown error']
        };
    }
}
