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
    created_at: string;
    updated_at: string;
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

// Admin: Get all leads
export async function getLeads(): Promise<DemoLead[]> {
    const supabase = createAdminClient();

    const { data, error } = await supabase
        .from('demo_leads')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching leads:', error);
        return [];
    }

    return data || [];
}

// Admin: Update lead status
export async function updateLeadStatus(
    leadId: string,
    status: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = createAdminClient();

    const { error } = await supabase
        .from('demo_leads')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', leadId);

    if (error) {
        console.error('Error updating lead status:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/admin/leads');
    return { success: true };
}

// Admin: Update admin notes
export async function updateLeadNotes(
    leadId: string,
    notes: string
): Promise<{ success: boolean; error?: string }> {
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
    return { success: true };
}
