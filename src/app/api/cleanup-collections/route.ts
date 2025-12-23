import { NextResponse } from 'next/server';
import { cleanupDuplicateCollectionsAction } from '@/app/actions/collections';

export async function POST() {
    try {
        const result = await cleanupDuplicateCollectionsAction();
        return NextResponse.json(result);
    } catch (error) {
        console.error('[cleanup-collections] Error:', error);
        return NextResponse.json({ success: false, error: 'Cleanup failed' }, { status: 500 });
    }
}
