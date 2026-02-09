'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export interface DemoLead {
    id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    preferred_contact: 'email' | 'phone' | 'either';
    job_title: string | null;
    company_name: string | null;
    employee_count: string | null;
    interests: string[];
    decision_timeline: string | null;
    problems_to_solve: string | null;
    status: 'new' | 'contacted' | 'qualified' | 'converted' | 'closed';
    admin_notes: string | null;
    claimed_by: string | null;
    claimed_by_name: string | null;
    created_at: string;
    updated_at: string;
}

export interface LeadOwner {
    id: string;
    full_name: string;
    lead_count: number;
}

// Public: Submit demo request (no auth required)
export async function submitDemoRequest(formData: FormData): Promise<{ success: boolean; error?: string }> {
    const supabase = createAdminClient();

    const full_name = (formData.get('fullName') as string)?.trim();
    const email = (formData.get('email') as string)?.trim() || null;
    const phone = (formData.get('phone') as string)?.trim() || null;
    const preferred_contact = (formData.get('preferredContact') as string) || 'either';
    const job_title = (formData.get('jobTitle') as string)?.trim() || null;
    const company_name = (formData.get('companyName') as string)?.trim() || null;
    const employee_count = (formData.get('employeeCount') as string) || null;
    const interests = formData.getAll('interests') as string[];
    const decision_timeline = (formData.get('decisionTimeline') as string) || null;
    const problems_to_solve = (formData.get('problemsToSolve') as string)?.trim() || null;

    if (!full_name) {
        return { success: false, error: 'Full name is required.' };
    }
    if (!email && !phone) {
        return { success: false, error: 'Please provide at least one contact method (email or phone).' };
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { success: false, error: 'Please enter a valid email address.' };
    }

    const { error } = await supabase.from('demo_leads').insert({
        full_name,
        email,
        phone,
        preferred_contact,
        job_title,
        company_name,
        employee_count: employee_count || null,
        interests,
        decision_timeline: decision_timeline || null,
        problems_to_solve,
    });

    if (error) {
        console.error('Error submitting demo request:', error);
        return { success: false, error: 'Something went wrong. Please try again.' };
    }

    return { success: true };
}

// Admin/Sales: Get all leads with claimed_by info
export async function getLeads(): Promise<DemoLead[]> {
    const supabase = createAdminClient();

    const { data, error } = await supabase
        .from('demo_leads')
        .select('*, claimer:claimed_by(full_name)')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching leads:', error);
        return [];
    }

    return (data || []).map((lead: any) => ({
        id: lead.id,
        full_name: lead.full_name,
        email: lead.email,
        phone: lead.phone,
        preferred_contact: lead.preferred_contact,
        job_title: lead.job_title,
        company_name: lead.company_name,
        employee_count: lead.employee_count,
        interests: lead.interests,
        decision_timeline: lead.decision_timeline,
        problems_to_solve: lead.problems_to_solve,
        status: lead.status,
        admin_notes: lead.admin_notes,
        claimed_by: lead.claimed_by,
        claimed_by_name: lead.claimer?.full_name || null,
        created_at: lead.created_at,
        updated_at: lead.updated_at,
    }));
}

// Admin/Sales: Update lead status and claim it for the current user
export async function updateLeadStatus(
    leadId: string,
    status: string
): Promise<{ success: boolean; error?: string; claimed_by?: string; claimed_by_name?: string }> {
    const supabase = createAdminClient();

    // Get current user to claim the lead
    const { createClient } = await import('@/lib/supabase/server');
    const authClient = await createClient();
    const { data: { user } } = await authClient.auth.getUser();

    if (!user) {
        return { success: false, error: 'Authentication required' };
    }

    // Get user's name for the response
    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

    const { error } = await supabase
        .from('demo_leads')
        .update({
            status,
            claimed_by: user.id,
            updated_at: new Date().toISOString(),
        })
        .eq('id', leadId);

    if (error) {
        console.error('Error updating lead status:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/admin/leads');
    revalidatePath('/sales/leads');
    return {
        success: true,
        claimed_by: user.id,
        claimed_by_name: profile?.full_name || 'Unknown',
    };
}

// Admin/Sales: Update admin notes
export async function updateLeadNotes(
    leadId: string,
    notes: string
): Promise<{ success: boolean; error?: string }> {
    // Verify authentication
    const { createClient } = await import('@/lib/supabase/server');
    const authClient = await createClient();
    const { data: { user } } = await authClient.auth.getUser();

    if (!user) {
        return { success: false, error: 'Authentication required' };
    }

    const supabase = createAdminClient();

    const { error } = await supabase
        .from('demo_leads')
        .update({ admin_notes: notes, updated_at: new Date().toISOString() })
        .eq('id', leadId);

    if (error) {
        console.error('Error updating lead notes:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/admin/leads');
    revalidatePath('/sales/leads');
    return { success: true };
}

// Admin/Sales: Get all potential lead owners (sales users + admins) with lead counts
export async function getLeadOwners(): Promise<LeadOwner[]> {
    const supabase = createAdminClient();

    // Get all sales users and platform admins
    const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .or('is_sales.eq.true,role.eq.admin');

    if (usersError || !users) {
        console.error('Error fetching lead owners:', usersError);
        return [];
    }

    // Get lead counts per owner
    const { data: leads, error: leadsError } = await supabase
        .from('demo_leads')
        .select('claimed_by')
        .not('claimed_by', 'is', null);

    const countMap = new Map<string, number>();
    (leads || []).forEach((lead: any) => {
        const count = countMap.get(lead.claimed_by) || 0;
        countMap.set(lead.claimed_by, count + 1);
    });

    return users.map(user => ({
        id: user.id,
        full_name: user.full_name || 'Unknown',
        lead_count: countMap.get(user.id) || 0,
    })).sort((a, b) => a.full_name.localeCompare(b.full_name));
}
