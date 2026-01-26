'use server';

// Course promotion actions - ONLY work in development
// These actions send course data to production for import

interface PromoteCourseResult {
    success: boolean;
    productionCourseId?: number;
    error?: string;
}

interface PromotionStatus {
    id: string;
    course_id: number;
    course_title: string;
    total_videos: number;
    processed_videos: number;
    status: 'pending' | 'processing' | 'complete' | 'error';
    error_message?: string;
    created_at: string;
    updated_at: string;
}

export async function promoteCourseToProduction(courseId: number): Promise<PromoteCourseResult> {
    // Only allow in development
    if (process.env.NODE_ENV !== 'development') {
        return { success: false, error: 'Promotion only available in development' };
    }

    const prodUrl = process.env.PROD_APP_URL;
    const secretKey = process.env.COURSE_IMPORT_SECRET;

    if (!prodUrl || !secretKey) {
        return { success: false, error: 'Missing PROD_APP_URL or COURSE_IMPORT_SECRET environment variables' };
    }

    try {
        // Import supabase client dynamically to avoid issues
        const { createClient } = await import('@supabase/supabase-js');

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Fetch complete course data
        const { data: course, error: courseError } = await supabase
            .from('courses')
            .select('*')
            .eq('id', courseId)
            .single();

        if (courseError || !course) {
            return { success: false, error: 'Course not found' };
        }

        // Fetch modules
        const { data: modules, error: modulesError } = await supabase
            .from('modules')
            .select('*')
            .eq('course_id', courseId)
            .order('order', { ascending: true });

        if (modulesError) {
            console.error('Error fetching modules:', modulesError);
        }
        console.log(`[Promotion] Found ${modules?.length || 0} modules for course ${courseId}`);

        // Fetch lessons for all modules
        const moduleIds = modules?.map(m => m.id) || [];
        let lessons: any[] = [];

        if (moduleIds.length > 0) {
            const { data: lessonsData, error: lessonsError } = await supabase
                .from('lessons')
                .select('*')
                .in('module_id', moduleIds)
                .order('order', { ascending: true });

            if (lessonsError) {
                console.error('Error fetching lessons:', lessonsError);
            }
            lessons = lessonsData || [];
            console.log(`[Promotion] Found ${lessons.length} lessons`);
        }

        // Fetch resources
        const { data: resources, error: resourcesError } = await supabase
            .from('resources')
            .select('*')
            .eq('course_id', courseId);

        if (resourcesError) {
            console.error('Error fetching resources:', resourcesError);
        }
        console.log(`[Promotion] Found ${resources?.length || 0} resources`);

        // Send to production
        const response = await fetch(`${prodUrl}/api/course-import`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                course,
                modules: modules || [],
                lessons: lessons || [],
                resources: resources || [],
                secretKey,
            }),
        });

        const result = await response.json();

        if (!result.success) {
            return { success: false, error: result.error || 'Import failed' };
        }

        // Trigger video processing asynchronously
        fetch(`${prodUrl}/api/course-import/process-videos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                courseId: result.productionCourseId,
                secretKey,
            }),
        }).catch(console.error); // Fire and forget

        return {
            success: true,
            productionCourseId: result.productionCourseId,
        };

    } catch (error: unknown) {
        console.error('Promotion error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Promotion failed';
        return { success: false, error: errorMessage };
    }
}

export async function getPromotionStatus(productionCourseId: number): Promise<{ success: boolean; status?: PromotionStatus; error?: string }> {
    if (process.env.NODE_ENV !== 'development') {
        return { success: false, error: 'Only available in development' };
    }

    const prodUrl = process.env.PROD_APP_URL;
    const secretKey = process.env.COURSE_IMPORT_SECRET;

    if (!prodUrl || !secretKey) {
        return { success: false, error: 'Missing environment variables' };
    }

    try {
        const response = await fetch(
            `${prodUrl}/api/course-import/status?courseId=${productionCourseId}&secretKey=${secretKey}`
        );

        const result = await response.json();

        if (!result.success) {
            return { success: false, error: result.error };
        }

        return { success: true, status: result.status };

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return { success: false, error: errorMessage };
    }
}

export async function getAllPromotionStatuses(): Promise<{ success: boolean; statuses?: PromotionStatus[]; error?: string }> {
    if (process.env.NODE_ENV !== 'development') {
        return { success: false, error: 'Only available in development' };
    }

    const prodUrl = process.env.PROD_APP_URL;
    const secretKey = process.env.COURSE_IMPORT_SECRET;

    if (!prodUrl || !secretKey) {
        return { success: false, error: 'Missing environment variables' };
    }

    try {
        const response = await fetch(
            `${prodUrl}/api/course-import/status/all?secretKey=${secretKey}`
        );

        const result = await response.json();
        return result;

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return { success: false, error: errorMessage };
    }
}
