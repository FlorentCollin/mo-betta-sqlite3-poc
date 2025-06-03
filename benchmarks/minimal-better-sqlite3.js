const Database = require('better-sqlite3');

const db = new Database('benchmark.db');
const stmt = db.prepare('SELECT id, name, email, description, score, active FROM users LIMIT 10000');

let count = 0;

for (const row of stmt.iterate()) {
    count++;
    // Minimal access - just check if fields exist
    if (row.id && row.name && row.email) {
        // Do nothing - just accessing the fields
    }
}

db.close();

console.log(`better-sqlite3: Processed ${count} rows (minimal access)`);
