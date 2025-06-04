const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('benchmark.db');
db.exec('PRAGMA journal_mode = WAL');

function all(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

async function benchmark() {
    const rows = await all('SELECT id, name, email, description, score, active FROM users');

    let count = 0;
    let totalLength = 0;

    for (const row of rows) {
        count++;
        // Access all string fields to ensure they're processed
        totalLength += row.name.length + row.email.length + row.description.length;
    }

    db.close();

    console.log(`node-sqlite3: Processed ${count} rows, ${totalLength} total string chars`);
}

benchmark().catch(console.error);
