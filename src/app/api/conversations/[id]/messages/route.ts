import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { role, content } = body;

  if (!role || !content) {
    return NextResponse.json({ error: 'Missing role or content' }, { status: 400 });
  }

  // Verify conversation ownership
  const { data: conversation, error: conversationError } = await supabase
    .from('conversations')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (conversationError || !conversation) {
    return NextResponse.json({ error: 'Conversation not found or unauthorized' }, { status: 404 });
  }

  const { data: message, error } = await supabase
    .from('conversation_messages')
    .insert({
      conversation_id: id,
      role,
      content,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Update conversation updated_at
  await supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', id);

  return NextResponse.json(message);
}
