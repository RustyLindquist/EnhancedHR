'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface ExpertProfile {
    id: string;
    full_name: string | null;
    email: string;
    phone_number: string | null;
    avatar_url: string | null;
    author_status: 'pending' | 'approved' | 'rejected';
    author_bio: string | null;
    expert_title: string | null;
    linkedin_url: string | null;
    credentials: string | null;
    course_proposal_title: string | null;
    course_proposal_description: string | null;
    application_status: string | null;
    application_submitted_at: string | null;
    approved_at: string | null;
    created_at: string;
}

export interface ExpertCourse {
    id: number;
    title: string;
    description: string | null;
    status: 'draft' | 'published' | 'archived';
    category: string | null;
    image_url: string | null;
    created_at: string;
}

export interface ExpertPerformance {
    // All-time metrics
    allTime: {
        watchMinutes: number;
        citations: number;
        students: number;
        completions: number;
        courses: number;
    };
    // Current month metrics
    currentMonth: {
        watchMinutes: number;
        citations: number;
        activeLearners: number;
        completions: number;
        sharePercent: number;
    };
    // Previous month for comparison
    previousMonth: {
        watchMinutes: number;
        citations: number;
    };
    // Month label
    monthLabel: string;
}

// Get expert details including profile, email, and related data
export async function getExpertDetails(expertId: string): Promise<{
    expert: ExpertProfile | null;
    error?: string;
}> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { expert: null, error: 'Not authenticated' };
    }

    // Check if user is admin
    const { data: currentProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (currentProfile?.role !== 'admin') {
        return { expert: null, error: 'Unauthorized' };
    }

    const admin = await createAdminClient();

    // Get profile data - query without approved_at first for backwards compatibility
    let profile;
    let profileError;

    // Try with approved_at first
    const result = await admin
        .from('profiles')
        .select(`
            id,
            full_name,
            phone_number,
            avatar_url,
            author_status,
            author_bio,
            expert_title,
            linkedin_url,
            credentials,
            course_proposal_title,
            course_proposal_description,
            application_status,
            application_submitted_at,
            approved_at,
            created_at
        `)
        .eq('id', expertId)
        .single();

    // If approved_at doesn't exist, fallback to query without it
    if (result.error?.message?.includes('approved_at')) {
        const fallbackResult = await admin
            .from('profiles')
            .select(`
                id,
                full_name,
                phone_number,
                avatar_url,
                author_status,
                author_bio,
                expert_title,
                linkedin_url,
                credentials,
                course_proposal_title,
                course_proposal_description,
                application_status,
                application_submitted_at,
                created_at
            `)
            .eq('id', expertId)
            .single();
        profile = fallbackResult.data ? { ...fallbackResult.data, approved_at: null } : null;
        profileError = fallbackResult.error;
    } else {
        profile = result.data;
        profileError = result.error;
    }

    if (profileError) {
        console.error('Error fetching expert profile:', profileError);
        return { expert: null, error: profileError.message };
    }

    // Get email from auth.users
    const { data: authUsers } = await admin.auth.admin.listUsers();
    const authUser = authUsers?.users?.find(u => u.id === expertId);
    const email = authUser?.email || '';

    return {
        expert: {
            ...profile,
            email
        } as ExpertProfile
    };
}

// Get expert's courses
export async function getExpertCourses(expertId: string): Promise<{
    courses: ExpertCourse[];
    error?: string;
}> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { courses: [], error: 'Not authenticated' };
    }

    // Check if user is admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') {
        return { courses: [], error: 'Unauthorized' };
    }

    const admin = await createAdminClient();
    const { data: courses, error } = await admin
        .from('courses')
        .select('id, title, description, status, category, image_url, created_at')
        .eq('author_id', expertId)
        .order('created_at', { ascending: false });

    // If author_id column doesn't exist, return empty array gracefully
    if (error) {
        if (error.message?.includes('author_id')) {
            console.log('Note: author_id column not found on courses table. Run migration to enable course linking.');
            return { courses: [] };
        }
        console.error('Error fetching expert courses:', error);
        return { courses: [], error: error.message };
    }

    return { courses: courses || [] };
}

// Get expert performance metrics
export async function getExpertPerformance(expertId: string): Promise<{
    performance: ExpertPerformance | null;
    error?: string;
}> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { performance: null, error: 'Not authenticated' };
    }

    // Check if user is admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') {
        return { performance: null, error: 'Unauthorized' };
    }

    const admin = await createAdminClient();

    // Get date ranges
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
    const monthLabel = now.toLocaleString('default', { month: 'long', year: 'numeric' });
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

    // Get expert's courses
    const { data: courses } = await admin
        .from('courses')
        .select('id')
        .eq('author_id', expertId);

    const courseIds = courses?.map(c => c.id) || [];
    const publishedCourseCount = courses?.length || 0;

    // ========== ALL-TIME METRICS ==========

    // All-time: Unique students
    const { data: allStudentProgress } = await admin
        .from('user_progress')
        .select('user_id')
        .in('course_id', courseIds.length > 0 ? courseIds : [-1]);
    const allTimeStudents = new Set(allStudentProgress?.map(p => p.user_id) || []).size;

    // All-time: Total watch time
    const { data: allTimeWatchData } = await admin
        .from('user_progress')
        .select('view_time_seconds')
        .in('course_id', courseIds.length > 0 ? courseIds : [-1]);
    const allTimeWatchMinutes = (allTimeWatchData?.reduce((sum, p) => sum + (p.view_time_seconds || 0), 0) || 0) / 60;

    // All-time: Citations
    const { data: allTimeCitationsData } = await admin
        .from('ai_content_citations')
        .select('id')
        .eq('author_id', expertId);
    const allTimeCitations = allTimeCitationsData?.length || 0;

    // All-time: Course completions
    const { data: allCompletions } = await admin
        .from('user_progress')
        .select('user_id, course_id, is_completed')
        .in('course_id', courseIds.length > 0 ? courseIds : [-1])
        .eq('is_completed', true);

    const completedCoursePairs = new Set(
        allCompletions?.map(c => `${c.user_id}-${c.course_id}`) || []
    );
    const allTimeCompletions = completedCoursePairs.size;

    // ========== CURRENT MONTH METRICS ==========

    // Current month: Watch time
    const { data: monthlyWatchData } = await admin
        .from('user_progress')
        .select('view_time_seconds')
        .in('course_id', courseIds.length > 0 ? courseIds : [-1])
        .gte('last_accessed', startOfMonth)
        .lte('last_accessed', endOfMonth);
    const monthlyWatchMinutes = (monthlyWatchData?.reduce((sum, p) => sum + (p.view_time_seconds || 0), 0) || 0) / 60;

    // Previous month: Watch time
    const { data: prevMonthWatchData } = await admin
        .from('user_progress')
        .select('view_time_seconds')
        .in('course_id', courseIds.length > 0 ? courseIds : [-1])
        .gte('last_accessed', startOfPrevMonth)
        .lte('last_accessed', endOfPrevMonth);
    const prevMonthWatchMinutes = (prevMonthWatchData?.reduce((sum, p) => sum + (p.view_time_seconds || 0), 0) || 0) / 60;

    // Current month: Citations
    const { data: monthlyCitationsData } = await admin
        .from('ai_content_citations')
        .select('id')
        .eq('author_id', expertId)
        .gte('created_at', startOfMonth)
        .lte('created_at', endOfMonth);
    const monthlyCitations = monthlyCitationsData?.length || 0;

    // Previous month: Citations
    const { data: prevMonthlyCitationsData } = await admin
        .from('ai_content_citations')
        .select('id')
        .eq('author_id', expertId)
        .gte('created_at', startOfPrevMonth)
        .lte('created_at', endOfPrevMonth);
    const prevMonthlyCitations = prevMonthlyCitationsData?.length || 0;

    // Current month: Active learners
    const { data: monthlyActiveUsers } = await admin
        .from('user_progress')
        .select('user_id')
        .in('course_id', courseIds.length > 0 ? courseIds : [-1])
        .gte('last_accessed', startOfMonth)
        .lte('last_accessed', endOfMonth);
    const monthlyActiveLearners = new Set(monthlyActiveUsers?.map(p => p.user_id) || []).size;

    // Current month: Completions
    const { data: monthlyProgress } = await admin
        .from('user_progress')
        .select('user_id, course_id, is_completed')
        .in('course_id', courseIds.length > 0 ? courseIds : [-1])
        .gte('last_accessed', startOfMonth)
        .lte('last_accessed', endOfMonth)
        .eq('is_completed', true);
    const monthlyCompletions = new Set(
        monthlyProgress?.map(p => `${p.user_id}-${p.course_id}`) || []
    ).size;

    // Platform-wide monthly watch time for share calculation
    const { data: platformMonthlyWatchTime } = await admin
        .from('user_progress')
        .select('view_time_seconds')
        .gte('last_accessed', startOfMonth)
        .lte('last_accessed', endOfMonth);
    const platformTotalMinutes = (platformMonthlyWatchTime?.reduce((sum, p) => sum + (p.view_time_seconds || 0), 0) || 0) / 60;
    const monthlySharePercent = platformTotalMinutes > 0 ? (monthlyWatchMinutes / platformTotalMinutes) * 100 : 0;

    return {
        performance: {
            allTime: {
                watchMinutes: allTimeWatchMinutes,
                citations: allTimeCitations,
                students: allTimeStudents,
                completions: allTimeCompletions,
                courses: publishedCourseCount
            },
            currentMonth: {
                watchMinutes: monthlyWatchMinutes,
                citations: monthlyCitations,
                activeLearners: monthlyActiveLearners,
                completions: monthlyCompletions,
                sharePercent: monthlySharePercent
            },
            previousMonth: {
                watchMinutes: prevMonthWatchMinutes,
                citations: prevMonthlyCitations
            },
            monthLabel
        }
    };
}

// Approve or reject expert (wrapper around existing API)
export async function updateExpertStatus(
    expertId: string,
    action: 'approve' | 'reject',
    rejectionNotes?: string
): Promise<{
    success: boolean;
    error?: string;
}> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Not authenticated' };
    }

    // Check if user is admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') {
        return { success: false, error: 'Unauthorized' };
    }

    const admin = await createAdminClient();

    // Update expert status
    const updateData: Record<string, string | null> = {
        author_status: action === 'approve' ? 'approved' : 'rejected',
        application_status: action === 'approve' ? 'approved' : 'rejected'
    };

    if (action === 'approve') {
        updateData.approved_at = new Date().toISOString();
        updateData.rejection_notes = null; // Clear any previous rejection notes
    } else if (action === 'reject' && rejectionNotes) {
        updateData.rejection_notes = rejectionNotes;
    }

    const { error: profileError } = await admin
        .from('profiles')
        .update(updateData)
        .eq('id', expertId);

    if (profileError) {
        console.error('Error updating expert status:', profileError);
        return { success: false, error: profileError.message };
    }

    // Update user role in auth metadata if approving
    if (action === 'approve') {
        const { error: authError } = await admin.auth.admin.updateUserById(expertId, {
            user_metadata: { role: 'author' }
        });

        if (authError) {
            console.error('Error updating user role:', authError);
            // Don't fail the operation, profile is already updated
        }
    }

    // Log the admin action
    await admin.from('admin_audit_log').insert({
        admin_id: user.id,
        action: action === 'approve' ? 'expert_approved' : 'expert_rejected',
        target_type: 'expert',
        target_id: expertId,
        details: action === 'reject' && rejectionNotes ? { rejection_notes: rejectionNotes } : null
    });

    revalidatePath('/admin/experts');
    revalidatePath(`/admin/experts/${expertId}`);

    return { success: true };
}

// Update expert profile fields (admin only)
export async function updateExpertProfile(
    expertId: string,
    data: {
        credentials?: string;
        author_bio?: string;
        expert_title?: string;
    }
): Promise<{
    success: boolean;
    error?: string;
}> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Not authenticated' };
    }

    // Check if user is admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') {
        return { success: false, error: 'Unauthorized' };
    }

    const admin = await createAdminClient();

    const updateData: Record<string, string | undefined> = {};
    if (data.credentials !== undefined) updateData.credentials = data.credentials;
    if (data.author_bio !== undefined) updateData.author_bio = data.author_bio;
    if (data.expert_title !== undefined) updateData.expert_title = data.expert_title;

    const { error } = await admin
        .from('profiles')
        .update(updateData)
        .eq('id', expertId);

    if (error) {
        console.error('Error updating expert profile:', error);
        return { success: false, error: error.message };
    }

    revalidatePath(`/admin/experts/${expertId}`);
    return { success: true };
}
