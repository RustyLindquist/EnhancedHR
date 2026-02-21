/**
 * Embedding Coverage Status API Endpoint
 *
 * Returns embedding coverage statistics for a course or all courses.
 * Useful for diagnosing RAG issues and identifying courses that need reindexing.
 *
 * GET /api/course-import/embedding-status?courseId=123&secretKey=xxx
 * GET /api/course-import/embedding-status?secretKey=xxx  (all courses summary)
 */

import { NextResponse, NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const secretKey = searchParams.get('secretKey');
    const courseId = searchParams.get('courseId');

    if (secretKey !== process.env.COURSE_IMPORT_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createAdminClient();

    if (courseId) {
        // Detailed status for a specific course
        return await getCourseEmbeddingStatus(admin, parseInt(courseId));
    } else {
        // Summary across all courses
        return await getAllCoursesEmbeddingStatus(admin);
    }
}

async function getCourseEmbeddingStatus(admin: any, courseId: number) {
    // Get course info
    const { data: course } = await admin
        .from('courses')
        .select('id, title, status')
        .eq('id', courseId)
        .single();

    if (!course) {
        return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Get all lessons for this course
    const { data: modules } = await admin
        .from('modules')
        .select('id, title, lessons(id, title, type, ai_transcript, user_transcript, transcript_status, content)')
        .eq('course_id', courseId)
        .order('order');

    // Get embedding counts per lesson
    const { data: embeddings } = await admin
        .from('unified_embeddings')
        .select('source_id, id')
        .eq('course_id', courseId)
        .eq('source_type', 'lesson');

    // Build embedding count map
    const embeddingCountMap = new Map<string, number>();
    (embeddings || []).forEach((e: any) => {
        embeddingCountMap.set(e.source_id, (embeddingCountMap.get(e.source_id) || 0) + 1);
    });

    // Get resource embeddings too
    const { data: resourceEmbeddings } = await admin
        .from('unified_embeddings')
        .select('source_id, id')
        .eq('course_id', courseId)
        .eq('source_type', 'resource');

    const resourceEmbeddingCount = resourceEmbeddings?.length || 0;

    // Build lesson details
    const lessonDetails: any[] = [];
    let totalLessons = 0;
    let lessonsWithTranscript = 0;
    let lessonsWithEmbeddings = 0;
    let totalEmbeddings = 0;

    for (const mod of (modules || [])) {
        for (const lesson of (mod.lessons || []) as any[]) {
            totalLessons++;
            const hasTranscript = !!(lesson.ai_transcript?.trim() || lesson.user_transcript?.trim() || lesson.content?.trim());
            const embeddingCount = embeddingCountMap.get(lesson.id.toString()) || 0;

            if (hasTranscript) lessonsWithTranscript++;
            if (embeddingCount > 0) lessonsWithEmbeddings++;
            totalEmbeddings += embeddingCount;

            lessonDetails.push({
                id: lesson.id,
                title: lesson.title,
                module: mod.title,
                type: lesson.type,
                hasTranscript,
                transcriptSource: lesson.user_transcript?.trim() ? 'user' : lesson.ai_transcript?.trim() ? 'ai' : lesson.content?.trim() ? 'legacy' : 'none',
                transcriptStatus: lesson.transcript_status || 'unknown',
                embeddingCount,
                needsReindex: hasTranscript && embeddingCount === 0
            });
        }
    }

    return NextResponse.json({
        course: {
            id: course.id,
            title: course.title,
            status: course.status
        },
        summary: {
            totalLessons,
            lessonsWithTranscript,
            lessonsWithEmbeddings,
            lessonsNeedingReindex: lessonsWithTranscript - lessonsWithEmbeddings,
            totalLessonEmbeddings: totalEmbeddings,
            totalResourceEmbeddings: resourceEmbeddingCount,
            coverage: totalLessons > 0 ? `${Math.round((lessonsWithEmbeddings / totalLessons) * 100)}%` : 'N/A'
        },
        lessons: lessonDetails
    });
}

async function getAllCoursesEmbeddingStatus(admin: any) {
    // Get all published courses
    const { data: courses } = await admin
        .from('courses')
        .select('id, title, status')
        .in('status', ['published', 'draft'])
        .order('id');

    if (!courses || courses.length === 0) {
        return NextResponse.json({ courses: [], summary: { totalCourses: 0 } });
    }

    // Get lesson counts per course (via modules)
    const { data: allModules } = await admin
        .from('modules')
        .select('course_id, lessons(id, ai_transcript, user_transcript, content)')
        .in('course_id', courses.map((c: any) => c.id));

    // Get embedding counts per course
    const { data: allEmbeddings } = await admin
        .from('unified_embeddings')
        .select('course_id, id')
        .in('course_id', courses.map((c: any) => c.id))
        .eq('source_type', 'lesson');

    // Build maps
    const lessonCountMap = new Map<number, { total: number; withTranscript: number }>();
    (allModules || []).forEach((mod: any) => {
        const courseId = mod.course_id;
        if (!lessonCountMap.has(courseId)) {
            lessonCountMap.set(courseId, { total: 0, withTranscript: 0 });
        }
        const counts = lessonCountMap.get(courseId)!;
        for (const lesson of (mod.lessons || []) as any[]) {
            counts.total++;
            if (lesson.ai_transcript?.trim() || lesson.user_transcript?.trim() || lesson.content?.trim()) {
                counts.withTranscript++;
            }
        }
    });

    const embeddingCountMap = new Map<number, number>();
    (allEmbeddings || []).forEach((e: any) => {
        embeddingCountMap.set(e.course_id, (embeddingCountMap.get(e.course_id) || 0) + 1);
    });

    // Build course summaries
    const courseSummaries = courses.map((course: any) => {
        const lessons = lessonCountMap.get(course.id) || { total: 0, withTranscript: 0 };
        const embeddingCount = embeddingCountMap.get(course.id) || 0;

        return {
            id: course.id,
            title: course.title,
            status: course.status,
            totalLessons: lessons.total,
            lessonsWithTranscript: lessons.withTranscript,
            embeddingCount,
            hasEmbeddings: embeddingCount > 0,
            needsReindex: lessons.withTranscript > 0 && embeddingCount === 0,
            coverage: lessons.total > 0 ? `${Math.round((embeddingCount > 0 ? lessons.withTranscript : 0) / lessons.total * 100)}%` : 'N/A'
        };
    });

    const needsReindex = courseSummaries.filter((c: any) => c.needsReindex);

    return NextResponse.json({
        summary: {
            totalCourses: courses.length,
            coursesWithEmbeddings: courseSummaries.filter((c: any) => c.hasEmbeddings).length,
            coursesNeedingReindex: needsReindex.length
        },
        courses: courseSummaries,
        needsReindex: needsReindex.length > 0 ? needsReindex : undefined
    });
}
