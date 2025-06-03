const Database = require('better-sqlite3');

const db = new Database('benchmark.db');
const stmt = db.prepare('SELECT id, name, email, description, score, active FROM users');

let count = 0;
let totalLength = 0;

for (const row of stmt.iterate()) {
    count++;
    // Access all string fields to ensure they're processed
    totalLength += row.name.length + row.email.length + row.description.length;
}

db.close();

console.log(`better-sqlite3: Processed ${count} rows, ${totalLength} total string chars`);
