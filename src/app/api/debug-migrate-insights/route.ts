import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Fetch all memories
        const { data: memories } = await supabase
            .from('user_ai_memory')
            .select('*')
            .eq('user_id', user.id);

        if (!memories || memories.length === 0) {
            return NextResponse.json({ message: 'No memories to migrate' });
        }

        // 2. Insert as Context Items
        let count = 0;
        for (const memory of memories) {
            // Check existence (simple check by content to avoid dupes if run multiple times)
            // Or just insert and let RLS/ID handle it? 
            // Better to check if we already have an insight with this content.
            const { data: existing } = await supabase
                .from('user_context_items')
                .select('id')
                .eq('type', 'AI_INSIGHT')
                .contains('content', { insight: memory.content })
                .single();

            if (!existing) {
                await supabase.from('user_context_items').insert({
                    user_id: user.id,
                    collection_id: null,
                    type: 'AI_INSIGHT',
                    title: 'Insight from Conversation',
                    content: {
                        insight: memory.content,
                        type: memory.insight_type,
                        migrated: true
                    }
                });
                count++;
            }
        }

        // 3. Instantiate Profile Card (If missing)
        const { data: existingProfile } = await supabase
            .from('user_context_items')
            .select('id')
            .eq('user_id', user.id)
            .eq('type', 'PROFILE')
            .single();

        let profileCreated = false;
        if (!existingProfile) {
             await supabase.from('user_context_items').insert({
                user_id: user.id,
                // collection_id: 'personal-context', // Removed duplicate
                // PRD says "on the Personal Context Collection". 
                // My `fetchCollectionItems` query for personal-context looks for `collection_id` IS NULL.
                // So let's use NULL.
                collection_id: null,
                type: 'PROFILE',
                title: 'My Profile',
                content: {
                    role: 'HR Professional', 
                    // partial defaults to show it works
                }
            });
            profileCreated = true;
        }

        return NextResponse.json({ 
            success: true, 
            migrated_insights: count,
            profile_instantiated: profileCreated || !!existingProfile 
        });
    } catch (error) {
        return NextResponse.json({ error: (error as any).message }, { status: 500 });
    }
}
