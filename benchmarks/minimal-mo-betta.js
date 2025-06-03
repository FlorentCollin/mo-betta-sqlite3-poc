const { Database } = require('../index.js');

const db = new Database('benchmark.db');
const stmt = db.prepare('SELECT id, name, email, description, score, active FROM users LIMIT 10000');

let count = 0;

for (const row of stmt) {
    count++;
    // Minimal access - just check if fields exist
    if (row.id && row.name && row.email) {
        // Do nothing - just accessing the fields
    }
}

stmt.finalize();
db.close();

console.log(`mo-betta-sqlite3: Processed ${count} rows (minimal access)`);
