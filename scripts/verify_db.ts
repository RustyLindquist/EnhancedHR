import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gifkvpualcalzlctpgxz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpZmt2cHVhbGNhbHpsY3RwZ3h6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzMjMwNzIsImV4cCI6MjA3OTg5OTA3Mn0.E-00Om2EXdXvO5kI-vyRxR0lhfgeQdzqTFADuEKbAAY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
    console.log('Verifying Database Schema...');
    const results: any[] = [];

    // Helper to check table existence by selecting 1 row
    const checkTable = async (tableName: string, requiredColumns: string[] = []) => {
        try {
            // Check table existence
            const { error } = await supabase.from(tableName).select('*').limit(1);
            
            if (error) {
                if (error.code === '42P01') { // undefined_table
                    results.push({ type: 'TABLE', name: tableName, status: 'MISSING', error: error.message });
                } else {
                    // Could be RLS or other error, but table likely exists if not 42P01
                    results.push({ type: 'TABLE', name: tableName, status: 'EXISTS (RLS/Error)', details: error.message });
                }
            } else {
                results.push({ type: 'TABLE', name: tableName, status: 'EXISTS' });
            }

            // Check columns (indirectly via select)
            if (requiredColumns.length > 0) {
                const { error: colError } = await supabase.from(tableName).select(requiredColumns.join(',')).limit(1);
                if (colError) {
                     results.push({ type: 'COLUMNS', name: `${tableName} (${requiredColumns.join(', ')})`, status: 'MISSING/ERROR', error: colError.message });
                } else {
                     results.push({ type: 'COLUMNS', name: `${tableName} (${requiredColumns.join(', ')})`, status: 'EXISTS' });
                }
            }

        } catch (e: any) {
            results.push({ type: 'TABLE', name: tableName, status: 'ERROR', error: e.message });
        }
    };

    // 1. Check Profiles (Author Status)
    await checkTable('profiles', ['author_status', 'author_bio', 'linkedin_url', 'trial_minutes_used']);

    // 2. Check User Progress (View Time)
    await checkTable('user_progress', ['view_time_seconds']);

    // 3. Check Quiz Tables
    await checkTable('user_assessment_attempts');
    // Note: quiz_data is a column in lessons, let's check it
    await checkTable('lessons', ['quiz_data']);

    // 4. Check Certification Tables
    await checkTable('certificates');
    await checkTable('user_credits_ledger');

    // 5. Check AI Tables
    await checkTable('ai_content_citations');
    await checkTable('user_ai_memory');
    await checkTable('course_embeddings');
    await checkTable('ai_system_prompts');

    // 6. Check Ratings
    await checkTable('course_ratings');

    console.table(results);
}

verify();
