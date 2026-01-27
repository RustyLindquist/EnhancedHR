'use server';

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { findBrokenVideoUrls, fixBrokenVideoUrls } from '@/app/actions/mux';

/**
 * GET: Diagnose broken video URLs (shows what will be fixed)
 * POST: Fix broken video URLs (converts upload IDs to playback IDs)
 *
 * Admin only - requires admin role
 */

async function checkAdminAccess() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { authorized: false, error: 'Not authenticated' };
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') {
        return { authorized: false, error: 'Admin access required' };
    }

    return { authorized: true };
}

export async function GET() {
    const auth = await checkAdminAccess();
    if (!auth.authorized) {
        return NextResponse.json({ error: auth.error }, { status: 403 });
    }

    try {
        const { broken, total } = await findBrokenVideoUrls();

        return NextResponse.json({
            message: `Found ${broken.length} lessons with upload IDs (out of ${total} total with video URLs)`,
            broken,
            total,
        });
    } catch (error: any) {
        console.error('[fix-video-urls] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST() {
    const auth = await checkAdminAccess();
    if (!auth.authorized) {
        return NextResponse.json({ error: auth.error }, { status: 403 });
    }

    try {
        const { fixed, failed, results } = await fixBrokenVideoUrls();

        return NextResponse.json({
            message: `Fixed ${fixed} lessons, ${failed} failed`,
            fixed,
            failed,
            results,
        });
    } catch (error: any) {
        console.error('[fix-video-urls] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
