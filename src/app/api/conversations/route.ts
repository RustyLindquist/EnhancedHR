import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  console.log('[API Conversations] GET request received');
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError) {
      console.error('[API Conversations] GET Auth error:', authError);
  }

  if (!user) {
    console.warn('[API Conversations] GET Unauthorized');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('[API Conversations] GET User:', user.id);

  const { data: conversations, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('[API Conversations] GET DB Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log(`[API Conversations] GET Success. Found ${conversations?.length} conversations.`);
  return NextResponse.json(conversations);
}

export async function POST(req: NextRequest) {
  console.log('[API Conversations] POST request received');
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError) {
      console.error('[API Conversations] POST Auth error:', authError);
  }

  if (!user) {
    console.warn('[API Conversations] POST Unauthorized');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('[API Conversations] POST User:', user.id);

  const body = await req.json();
  const { title, metadata, is_saved } = body;

  const { data: conversation, error } = await supabase
    .from('conversations')
    .insert({
      user_id: user.id,
      title: title || 'New Conversation',
      metadata: metadata || {},
      is_saved: is_saved || false,
    })
    .select()
    .single();

  if (error) {
    console.error('[API Conversations] POST DB Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log('[API Conversations] POST Success:', conversation.id);
  return NextResponse.json(conversation);
}
