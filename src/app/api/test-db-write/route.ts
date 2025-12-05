import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    console.log('[Test DB Write] Starting diagnostic...');
    
    // 1. Use Admin Client (Service Role) to bypass RLS
    const supabaseAdmin = createAdminClient();
    
    // 2. Fetch ANY user to use as the owner of the test conversation
    // We need a valid user_id to satisfy the foreign key constraint
    const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1 });
    
    if (userError || !users.users || users.users.length === 0) {
        console.error('[Test DB Write] Failed to fetch any users:', userError);
        return NextResponse.json({ error: 'Could not find any users to test with', details: userError }, { status: 500 });
    }

    const testUserId = users.users[0].id;
    console.log('[Test DB Write] Using test user ID:', testUserId);

    // 3. Attempt Insert
    const testTitle = `Diagnostic Write ${new Date().toISOString()}`;
    const { data: conversation, error: insertError } = await supabaseAdmin
        .from('conversations')
        .insert({
            user_id: testUserId,
            title: testTitle,
            is_saved: false,
            metadata: { source: 'test-db-write' }
        })
        .select()
        .single();

    if (insertError) {
        console.error('[Test DB Write] Insert failed:', insertError);
        return NextResponse.json({ 
            status: 'Failed', 
            step: 'Insert', 
            error: insertError,
            testUserId 
        }, { status: 500 });
    }

    console.log('[Test DB Write] Insert success:', conversation.id);

    // 4. Clean up (Delete the test conversation)
    const { error: deleteError } = await supabaseAdmin
        .from('conversations')
        .delete()
        .eq('id', conversation.id);

    if (deleteError) {
        console.warn('[Test DB Write] Cleanup failed:', deleteError);
    }

    return NextResponse.json({
        status: 'Success',
        message: 'Database is writable via Service Role',
        testConversationId: conversation.id,
        testUserId,
        cleanup: deleteError ? 'Failed' : 'Success'
    });

  } catch (e: any) {
    console.error('[Test DB Write] Unexpected error:', e);
    return NextResponse.json({ error: e.message, stack: e.stack }, { status: 500 });
  }
}
