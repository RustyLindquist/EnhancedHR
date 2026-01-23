import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ExpertPageLayout from '@/components/ExpertPageLayout';

export default async function AuthorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Verify Author Access
    const { data: profile } = await supabase
        .from('profiles')
        .select('author_status, role')
        .eq('id', user.id)
        .single();

    // Experts (pending, approved, rejected) and platform admins can access Expert Console
    // Only users who never clicked "Become Expert" (status = 'none' or null) are blocked
    const hasExpertAccess = profile?.role === 'admin' ||
        (profile?.author_status && profile.author_status !== 'none');

    if (!hasExpertAccess) {
        redirect('/teach');
    }

    return (
        <ExpertPageLayout>
            {children}
        </ExpertPageLayout>
    );
}
