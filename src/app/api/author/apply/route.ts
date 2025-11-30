import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { bio, linkedinUrl } = await req.json();

        if (!bio || !linkedinUrl) {
            return NextResponse.json({ error: 'Bio and LinkedIn URL are required' }, { status: 400 });
        }

        // Update Profile
        const { error } = await supabase
            .from('profiles')
            .update({
                author_status: 'pending',
                author_bio: bio,
                linkedin_url: linkedinUrl,
                updated_at: new Date().toISOString()
            })
            .eq('id', user.id);

        if (error) {
            console.error('Error submitting author application:', error);
            return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error in author application:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
