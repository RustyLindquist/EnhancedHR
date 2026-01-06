import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getOrgDashboardMetrics, DashboardFilters } from '@/app/actions/org-dashboard';

export async function POST(request: NextRequest) {
    try {
        // Verify auth
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Parse request body
        const body = await request.json();
        const filters: DashboardFilters = {
            startDate: new Date(body.startDate),
            endDate: new Date(body.endDate),
            groupId: body.groupId || undefined,
            userId: body.userId || undefined,
        };

        // Fetch metrics (this function already verifies org admin access)
        const metrics = await getOrgDashboardMetrics(filters);

        if (!metrics) {
            return NextResponse.json({ error: 'Access denied or no data' }, { status: 403 });
        }

        return NextResponse.json(metrics);
    } catch (error) {
        console.error('Dashboard API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
