import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import SalesPageLayout from '@/components/SalesPageLayout';

export const dynamic = 'force-dynamic';

export default async function SalesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role, is_sales')
        .eq('id', user.id)
        .single();

    // Allow access for sales users and platform admins
    if (!profile?.is_sales && profile?.role !== 'admin') {
        redirect('/dashboard');
    }

    return (
        <SalesPageLayout>
            {children}
        </SalesPageLayout>
    );
}
