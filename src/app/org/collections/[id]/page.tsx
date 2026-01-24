import React from 'react';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getOrgContext } from '@/lib/org-context';
import OrgCollectionDetailView from '@/components/org/OrgCollectionDetailView';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function OrgCollectionDetailPage({ params }: PageProps) {
    const { id } = await params;
    const supabase = await createClient();
    const admin = createAdminClient();

    // Get org context
    const orgContext = await getOrgContext();
    if (!orgContext) {
        return <div className="text-white p-8">Access Denied</div>;
    }

    // Fetch the collection
    const { data: collection, error: collectionError } = await supabase
        .from('user_collections')
        .select('*')
        .eq('id', id)
        .eq('org_id', orgContext.orgId)
        .single();

    if (collectionError || !collection) {
        notFound();
    }

    // Fetch collection items (courses)
    const { data: collectionItems } = await supabase
        .from('collection_items')
        .select(`
            item_id,
            item_type,
            added_at,
            courses:course_id (
                id,
                title,
                status,
                cover_image_url
            )
        `)
        .eq('collection_id', id);

    // Fetch VIDEO items from user_context_items
    const { data: videoItems } = await admin
        .from('user_context_items')
        .select('id, title, content, created_at')
        .eq('collection_id', id)
        .eq('type', 'VIDEO')
        .eq('org_id', orgContext.orgId)
        .order('created_at', { ascending: false });

    // Map courses from collection_items
    const courses = collectionItems
        ?.filter(item => item.item_type === 'COURSE' && item.courses)
        .map(item => ({
            id: (item.courses as any).id,
            title: (item.courses as any).title,
            status: (item.courses as any).status,
            cover_image_url: (item.courses as any).cover_image_url,
            added_at: item.added_at,
        })) || [];

    // Map videos
    const videos = videoItems?.map(v => ({
        id: v.id,
        title: v.title,
        content: v.content,
        created_at: v.created_at,
    })) || [];

    return (
        <OrgCollectionDetailView
            collection={collection}
            courses={courses}
            videos={videos}
            isOrgAdmin={orgContext.isOrgAdmin || orgContext.isPlatformAdmin}
        />
    );
}
