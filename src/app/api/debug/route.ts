import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    return NextResponse.json({
        openrouterKeySet: !!process.env.OPENROUTER_API_KEY,
        openrouterKeyLength: process.env.OPENROUTER_API_KEY?.length || 0,
        geminiKeySet: !!process.env.GOOGLE_GENERATIVE_AI_API_KEY,
        geminiKeyLength: process.env.GOOGLE_GENERATIVE_AI_API_KEY?.length || 0,
        siteUrl: process.env.NEXT_PUBLIC_APP_URL || 'not set'
    });
}
