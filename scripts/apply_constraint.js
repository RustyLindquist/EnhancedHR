
const fs = require('fs');
const path = require('path');

async function run() {
    try {
        const sqlPath = path.join(__dirname, 'add_constraint.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Applying SQL constraint...');
        const response = await fetch('http://localhost:3000/api/admin/run-sql', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: sql })
        });

        const result = await response.json();
        if (result.error) {
            console.error('SQL Error:', result.error);
        } else {
            console.log('Success:', result);
        }
    } catch (error) {
        console.error('Error executing script:', error);
    }
}
run();
