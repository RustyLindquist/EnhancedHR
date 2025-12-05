import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const supabaseAdmin = createAdminClient();
    
    // Fetch last 10 conversations globally
    const { data: conversations, error } = await supabaseAdmin
        .from('conversations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Also fetch last 10 messages
    const { data: messages, error: messagesError } = await supabaseAdmin
        .from('conversation_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

        // 3. Fetch latest AI Logs
        const { data: aiLogs, error: aiLogsError } = await supabaseAdmin
            .from('ai_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);

        // 4. Fetch Profiles (to check role)
        const { data: profiles, error: profilesError } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .limit(5);

        return NextResponse.json({
            conversations: conversations || [],
            messages: messages || [],
            aiLogs: aiLogs || [],
            profiles: profiles || [],
            errors: {
                conversations: error,
                messages: messagesError,
                aiLogs: aiLogsError,
                profiles: profilesError
            }
        });

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
