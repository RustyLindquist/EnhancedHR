// GET /api/course-import/status/all?secretKey=xxx

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const secretKey = searchParams.get('secretKey');

    if (secretKey !== process.env.COURSE_IMPORT_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
        .from('course_import_status')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, statuses: data });
}
