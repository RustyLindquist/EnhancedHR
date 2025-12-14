const fs = require('fs');
const path = require('path');

async function run() {
    try {
        const migrationPath = path.join(__dirname, '../supabase/migrations/20251213000000_create_groups_and_assignments.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');

        const response = await fetch('http://localhost:3000/api/admin/run-sql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query: sql })
        });

        const result = await response.json();
        console.log(JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
}

run();
