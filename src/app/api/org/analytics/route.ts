import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAnalyticsContext, getAnalyticsScope } from '@/app/actions/cost-analytics';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user's analytics scope
    const scope = await getAnalyticsScope();
    if (!scope) {
      return NextResponse.json({ error: 'No analytics access' }, { status: 403 });
    }

    // Get request body
    const { daysBack = 30 } = await request.json();

    // Get analytics context (will be scoped based on user role)
    const context = await getAnalyticsContext(daysBack, scope);

    return NextResponse.json(context);
  } catch (error) {
    console.error('[OrgAnalytics] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
