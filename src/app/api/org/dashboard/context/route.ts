import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getDashboardContextForAI, DashboardFilters } from '@/app/actions/org-dashboard';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const filters: DashboardFilters = {
            startDate: new Date(body.startDate),
            endDate: new Date(body.endDate),
            groupId: body.groupId || undefined,
            userId: body.userId || undefined,
        };

        const context = await getDashboardContextForAI(filters);

        return NextResponse.json({ context });
    } catch (error) {
        console.error('Dashboard context API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
