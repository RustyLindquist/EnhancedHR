const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
});

async function checkProgress() {
    await client.connect();

    try {
        const res = await client.query('SELECT * FROM user_progress');
        console.log('User Progress Records:', res.rows);

        const users = await client.query('SELECT id, email FROM auth.users');
        console.log('Users:', users.rows);
    } catch (err) {
        console.error('Error executing query', err);
    } finally {
        await client.end();
    }
}

checkProgress();
