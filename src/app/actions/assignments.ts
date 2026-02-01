'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface ContentAssignment {
  id: string;
  org_id: string;
  assignee_type: 'user' | 'group' | 'org';
  assignee_id: string;
  content_type: 'course' | 'module' | 'lesson' | 'resource';
  content_id: string;
  assignment_type: 'required' | 'recommended';
  assigned_by?: string;
  created_at: string;
  content_details?: {
      title: string;
      thumbnail_url?: string;
      description?: string;
      author?: string;
      duration?: string;
      category?: string;
      rating?: number;
      badges?: string[];
      learning_status?: 'not_started' | 'in_progress' | 'completed';
      // Credit certification fields
      shrm_pdcs?: number;
      hrci_credits?: number;
  };
}

export async function assignContent(
    assigneeType: 'user' | 'group' | 'org',
    assigneeId: string,
    contentType: 'course' | 'module' | 'lesson' | 'resource',
    contentId: string,
    assignmentType: 'required' | 'recommended'
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'Unauthorized' };

    // Get Org ID
    const { data: profile } = await supabase.from('profiles').select('org_id, role').eq('id', user.id).single();
    if (!profile?.org_id) return { success: false, error: 'No Organization found' };
    if (profile.role !== 'admin' && profile.role !== 'org_admin') return { success: false, error: 'Permission denied' };

    const supabaseAdmin = await createAdminClient();

    // Create Assignment
    const { data, error } = await supabaseAdmin
        .from('content_assignments')
        .insert({
            org_id: profile.org_id,
            assignee_type: assigneeType,
            assignee_id: assigneeId,
            content_type: contentType,
            content_id: contentId,
            assignment_type: assignmentType,
            assigned_by: user.id
        })
        .select()
        .single();

    if (error) {
        console.error('Error assigning content:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/org/team'); // Revalidate broadly implies user dashboards too ideally
    revalidatePath('/dashboard'); 
    return { success: true, assignment: data };
}

export async function removeAssignment(assignmentId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin' && profile?.role !== 'org_admin') return { success: false, error: 'Permission denied' };

    const supabaseAdmin = await createAdminClient();
    const { error } = await supabaseAdmin.from('content_assignments').delete().eq('id', assignmentId);
    
    if (error) return { success: false, error: error.message };
    
    revalidatePath('/dashboard');
    return { success: true };
}

// Get assignments for a specific target (e.g., when viewing a User's profile as Admin, or a Group's profile)
export async function getDirectAssignments(assigneeType: 'user' | 'group', assigneeId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Check if Admin
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    const isAdmin = profile?.role === 'admin' || profile?.role === 'org_admin';

    let client = supabase;
    if (isAdmin) {
        client = await createAdminClient();
    }
    
    // Explicitly select columns to avoid any ambiguity
    const { data: assignments, error } = await client
        .from('content_assignments')
        .select('*')
        .eq('assignee_type', assigneeType)
        .eq('assignee_id', assigneeId)
        .order('created_at', { ascending: false });

    if (error) return [];

    // Ideally, we'd join with content tables (courses) to get titles. 
    // Since content is polymorphic and keys might not match simply in SQL join without complex view,
    // we might need to fetch content details separately or rely on client to fetch.
    // For MVP, let's try to fetch course titles if content_type is course.
    
    const enriched = await Promise.all(assignments.map(async (a) => {
        let contentDetails: ContentAssignment['content_details'] = { title: 'Unknown Content' };

        if (a.content_type === 'course') {
            const { data: course } = await client
                .from('courses')
                .select('title, image_url, description, author, duration, category, rating, badges, shrm_pdcs, hrci_credits')
                .eq('id', a.content_id)
                .single();
            if (course) {
                contentDetails = {
                    title: course.title,
                    thumbnail_url: course.image_url || undefined,
                    description: course.description || undefined,
                    author: course.author || undefined,
                    duration: course.duration || undefined,
                    category: course.category || undefined,
                    rating: course.rating ? Number(course.rating) : undefined,
                    badges: course.badges || undefined,
                    shrm_pdcs: course.shrm_pdcs || undefined,
                    hrci_credits: course.hrci_credits || undefined
                };
            }
        } else if (a.content_type === 'module') {
            const { data: module } = await client
                .from('modules')
                .select('title, description, duration, courses(title, image_url, author)')
                .eq('id', a.content_id)
                .single();
            if (module) {
                const courseData = module.courses as any;
                contentDetails = {
                    title: module.title,
                    thumbnail_url: courseData?.image_url || undefined,
                    description: courseData?.title || module.description || undefined,
                    author: courseData?.author || 'EnhancedHR',
                    duration: module.duration || undefined,
                    category: 'Module'
                };
            }
        } else if (a.content_type === 'lesson') {
            const { data: lesson } = await client
                .from('lessons')
                .select('title, duration, type, modules(title, courses(title, image_url, author))')
                .eq('id', a.content_id)
                .single();
            if (lesson) {
                const moduleData = lesson.modules as any;
                const courseData = moduleData?.courses as any;
                contentDetails = {
                    title: lesson.title,
                    thumbnail_url: courseData?.image_url || undefined,
                    description: courseData?.title ? `${courseData.title} → ${moduleData?.title}` : moduleData?.title || undefined,
                    author: courseData?.author || 'EnhancedHR',
                    duration: lesson.duration || undefined,
                    category: lesson.type || 'Lesson'
                };
            }
        } else if (a.content_type === 'resource') {
            const { data: resource } = await client
                .from('resources')
                .select('title, type, size, courses(title, image_url)')
                .eq('id', a.content_id)
                .single();
            if (resource) {
                const courseData = resource.courses as any;
                contentDetails = {
                    title: resource.title,
                    thumbnail_url: courseData?.image_url || undefined,
                    description: courseData?.title || 'Course Resource',
                    author: resource.type || 'Resource',
                    duration: resource.size || undefined,
                    category: 'Resource'
                };
            }
        }

        return {
            ...a,
            content_details: contentDetails
        };
    }));

    return enriched;
}

// Get ALL assignments for a user (Direct + Group + Org)
export async function getUserAggregateAssignments(userId: string) {
    const supabase = await createClient();
    
    // 1. Get User's Group IDs
    const { data: startGroups } = await supabase
        .from('employee_group_members')
        .select('group_id')
        .eq('user_id', userId);
    
    const groupIds = startGroups?.map(g => g.group_id) || [];

    // 2. Get User's Org ID
    const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', userId).single();
    const orgId = profile?.org_id;

    if (!orgId) return [];

    // 3. Query Assignments
    const { data: assignments, error } = await supabase
        .from('content_assignments')
        .select('*')
        .or(`assignee_type.eq.user,and(assignee_type.eq.group,assignee_id.in.(${groupIds.length > 0 ? groupIds.join(',') : '00000000-0000-0000-0000-000000000000'})),and(assignee_type.eq.org,org_id.eq.${orgId},assignee_id.eq.${orgId})`)
        // Note: OR syntax is tricky. Let's simplify: fetch by types separately or use a massive OR filter if possible.
        // Actually, let's just use Javascript filtering on specific queries if the OR query is syntax-heavy. Spreading queries is safer.
        
    // Standard approach:
    // A. Direct
    const { data: direct } = await supabase.from('content_assignments').select('*').eq('assignee_type', 'user').eq('assignee_id', userId);
    
    // B. Group
    let groupAssignments: any[] = [];
    if (groupIds.length > 0) {
        const { data: ga } = await supabase.from('content_assignments').select('*').eq('assignee_type', 'group').in('assignee_id', groupIds);
        if (ga) groupAssignments = ga;
    }

    // C. Org
    const { data: orgAssignments } = await supabase.from('content_assignments').select('*').eq('assignee_type', 'org').eq('org_id', orgId); // assignee_id check technically needed if we strictly follow schema, but org_id is safe enough context. But wait, assignee_id for type 'org' is likely undefined or the org ID? Plan said assignee_type='org'.

    const all = [
        ...(direct || []),
        ...(groupAssignments || []),
        ...(orgAssignments || [])
    ];

    // Deduplicate by content_type + content_id, keeping the most specific assignment
    // Priority: user > group > org
    type AssignmentRecord = typeof all[number];
    const priorityMap: Record<string, number> = { 'user': 3, 'group': 2, 'org': 1 };
    const deduped = all.reduce((acc, assignment) => {
        const key = `${assignment.content_type}-${assignment.content_id}`;
        const existing = acc.get(key);
        if (!existing || priorityMap[assignment.assignee_type] > priorityMap[existing.assignee_type]) {
            acc.set(key, assignment);
        }
        return acc;
    }, new Map<string, AssignmentRecord>());

    const dedupedAssignments: AssignmentRecord[] = Array.from(deduped.values());

    // Enrich (similar to above)
    const enriched = await Promise.all(dedupedAssignments.map(async (a) => {
        let contentDetails: ContentAssignment['content_details'] = { title: 'Unknown Content' };

        if (a.content_type === 'course') {
            const { data: course } = await supabase
                .from('courses')
                .select('title, image_url, description, author, duration, category, rating, badges, shrm_pdcs, hrci_credits')
                .eq('id', a.content_id)
                .single();
            if (course) {
                contentDetails = {
                    title: course.title,
                    thumbnail_url: course.image_url || undefined,
                    description: course.description || undefined,
                    author: course.author || undefined,
                    duration: course.duration || undefined,
                    category: course.category || undefined,
                    rating: course.rating ? Number(course.rating) : undefined,
                    badges: course.badges || undefined,
                    shrm_pdcs: course.shrm_pdcs || undefined,
                    hrci_credits: course.hrci_credits || undefined
                };
            }
        } else if (a.content_type === 'module') {
            const { data: module } = await supabase
                .from('modules')
                .select('title, description, duration, courses(title, image_url, author)')
                .eq('id', a.content_id)
                .single();
            if (module) {
                const courseData = module.courses as any;
                contentDetails = {
                    title: module.title,
                    thumbnail_url: courseData?.image_url || undefined,
                    description: courseData?.title || module.description || undefined,
                    author: courseData?.author || 'EnhancedHR',
                    duration: module.duration || undefined,
                    category: 'Module'
                };
            }
        } else if (a.content_type === 'lesson') {
            const { data: lesson } = await supabase
                .from('lessons')
                .select('title, duration, type, modules(title, courses(title, image_url, author))')
                .eq('id', a.content_id)
                .single();
            if (lesson) {
                const moduleData = lesson.modules as any;
                const courseData = moduleData?.courses as any;
                contentDetails = {
                    title: lesson.title,
                    thumbnail_url: courseData?.image_url || undefined,
                    description: courseData?.title ? `${courseData.title} → ${moduleData?.title}` : moduleData?.title || undefined,
                    author: courseData?.author || 'EnhancedHR',
                    duration: lesson.duration || undefined,
                    category: lesson.type || 'Lesson'
                };
            }
        } else if (a.content_type === 'resource') {
            const { data: resource } = await supabase
                .from('resources')
                .select('title, type, size, courses(title, image_url)')
                .eq('id', a.content_id)
                .single();
            if (resource) {
                const courseData = resource.courses as any;
                contentDetails = {
                    title: resource.title,
                    thumbnail_url: courseData?.image_url || undefined,
                    description: courseData?.title || 'Course Resource',
                    author: resource.type || 'Resource',
                    duration: resource.size || undefined,
                    category: 'Resource'
                };
            }
        }

        return {
            ...a,
            content_details: contentDetails
        };
    }));

    return enriched;
}
