
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 1. Check Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    // 2. Check Table Existence (via count)
    const { count, error: countError } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true });

    // 3. Check Insert (if user exists)
    let insertResult = null;
    let insertError = null;
    if (user) {
        const { data, error } = await supabase
            .from('conversations')
            .insert({
                user_id: user.id,
                title: 'Debug Conversation',
                is_saved: false
            })
            .select()
            .single();
        insertResult = data;
        insertError = error;
    }

    return NextResponse.json({
      status: 'Diagnostic Run',
      auth: { user: user?.id, error: authError },
      tableCheck: { count, error: countError },
      insertCheck: { success: !!insertResult, error: insertError },
      env: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      }
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, stack: e.stack }, { status: 500 });
  }
}
