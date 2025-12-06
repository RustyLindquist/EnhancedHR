import React from 'react';
import { createClient } from '@/lib/supabase/server';
import AuthorApprovalList from '@/components/admin/AuthorApprovalList';
import { redirect } from 'next/navigation';

export default async function AdminAuthorsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect('/login');

    // Verify Admin
    const { data: adminProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (adminProfile?.role !== 'admin') {
        return <div>Access Denied</div>;
    }

    // Fetch Pending Authors
    const { data: pendingAuthors } = await supabase
        .from('profiles')
        .select('id, full_name, email, author_bio, linkedin_url, created_at')
        .eq('author_status', 'pending')
        .order('updated_at', { ascending: false });

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Author Applications</h1>
                <p className="text-slate-400">Review and approve new instructor applications.</p>
            </div>

            <AuthorApprovalList authors={pendingAuthors || []} />
        </div>
    );
}
