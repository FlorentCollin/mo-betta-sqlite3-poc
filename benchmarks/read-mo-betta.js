const { Database } = require('../index.js');

const db = new Database('benchmark.db');
const stmt = db.prepare('SELECT id, name, email, description, score, active FROM users');

let count = 0;
let totalLength = 0;

let row;
while ((row = stmt.next()) !== undefined) {
    count++;
    // Access all string fields to ensure they're processed
    totalLength += row.name.length + row.email.length + row.description.length;
}

stmt.finalize();
db.close();

console.log(`mo-betta-sqlite3: Processed ${count} rows, ${totalLength} total string chars`);
