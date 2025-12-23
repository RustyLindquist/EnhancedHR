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
        .select('author_status')
        .eq('id', user.id)
        .single();

    // Only approved experts can access
    if (profile?.author_status !== 'approved') {
        redirect('/teach');
    }

    return (
        <ExpertPageLayout>
            {children}
        </ExpertPageLayout>
    );
}
