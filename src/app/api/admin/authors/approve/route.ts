import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify Admin (check both role and membership_status for backwards compatibility)
        const { data: adminProfile } = await supabase
            .from('profiles')
            .select('role, membership_status')
            .eq('id', user.id)
            .single();

        if (adminProfile?.role !== 'admin' && adminProfile?.membership_status !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { userId, action } = await req.json();

        if (!userId || !['approve', 'reject'].includes(action)) {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
        }

        const newAuthorStatus = action === 'approve' ? 'approved' : 'rejected';
        const newApplicationStatus = action === 'approve' ? 'approved' : 'rejected';
        // When approved, change role from pending_author to author
        // When rejected, keep as pending_author so they can resubmit
        const newRole = action === 'approve' ? 'author' : 'pending_author';

        // Use admin client to bypass RLS for updating other users' profiles
        const adminSupabase = await createAdminClient();

        // Update Profile
        const { error } = await adminSupabase
            .from('profiles')
            .update({
                author_status: newAuthorStatus,
                application_status: newApplicationStatus,
                role: newRole
            })
            .eq('id', userId);

        if (error) {
            console.error('Error updating author status:', error);
            return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error in author approval:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
