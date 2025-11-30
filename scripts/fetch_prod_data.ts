
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = 'https://gifkvpualcalzlctpgxz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpZmt2cHVhbGNhbHpsY3RwZ3h6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzMjMwNzIsImV4cCI6MjA3OTg5OTA3Mn0.E-00Om2EXdXvO5kI-vyRxR0lhfgeQdzqTFADuEKbAAY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const OUTPUT_FILE = path.join(process.cwd(), 'supabase', 'prod_data_seed.sql');

function escapeSqlValue(value: any): string {
    if (value === null || value === undefined) return 'NULL';
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
    if (Array.isArray(value)) {
        // Handle array types (e.g. text[])
        // PostgreSQL array format: '{val1,val2}'
        const arrayContent = value.map(v => `"${v.replace(/"/g, '\\"')}"`).join(',');
        return `'${'{' + arrayContent + '}'}'`; 
    }
    if (typeof value === 'object') {
        return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
    }
    // String
    return `'${value.toString().replace(/'/g, "''")}'`;
}

async function fetchDataAndGenerateSql() {
    console.log('Fetching data from production...');

    const tables = ['courses', 'modules', 'lessons', 'resources'];
    let sqlContent = '-- Auto-generated seed file from production data\n\n';

    for (const table of tables) {
        console.log(`Fetching ${table}...`);
        const { data, error } = await supabase.from(table).select('*');

        if (error) {
            console.error(`Error fetching ${table}:`, error);
            continue;
        }

        if (!data || data.length === 0) {
            console.log(`No data for ${table}`);
            continue;
        }

        console.log(`Found ${data.length} rows for ${table}`);
        
        // Generate INSERT statements
        const columns = Object.keys(data[0]).map(c => `"${c}"`).join(', ');
        
        sqlContent += `-- Data for ${table}\n`;
        
        for (const row of data) {
            const values = Object.values(row).map(escapeSqlValue).join(', ');
            sqlContent += `INSERT INTO public.${table} (${columns}) VALUES (${values}) ON CONFLICT DO NOTHING;\n`;
        }
        sqlContent += '\n';
    }

    fs.writeFileSync(OUTPUT_FILE, sqlContent);
    console.log(`SQL file generated at ${OUTPUT_FILE}`);
}

fetchDataAndGenerateSql().catch(console.error);
