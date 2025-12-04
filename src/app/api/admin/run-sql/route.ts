import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { Pool } from 'pg';

export async function POST(request: Request) {
  try {
    // 1. Auth Check (Strict Admin Only)
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin (using metadata or profile)
    // For now, we'll check the email against known admins or metadata
    const isAdmin = user.app_metadata?.role === 'admin' || 
                    user.user_metadata?.role === 'admin' ||
                    user.email === 'rustylindquist@gmail.com' || // Fallback for safety
                    user.email?.endsWith('@enhancedhr.ai'); // Internal team

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // 2. Get SQL from body
    const { query } = await request.json();
    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // 3. Connect to DB
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      return NextResponse.json({ error: 'DATABASE_URL is not set' }, { status: 500 });
    }

    // Disable SSL verification for local/dev if needed, but for prod usually needed.
    // Supabase transaction pooler usually requires SSL.
    const pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false } // Required for Supabase
    });

    const client = await pool.connect();
    try {
      const result = await client.query(query);
      return NextResponse.json({ success: true, rows: result.rows, rowCount: result.rowCount });
    } finally {
      client.release();
      await pool.end();
    }

  } catch (error) {
    console.error('SQL Execution Error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
