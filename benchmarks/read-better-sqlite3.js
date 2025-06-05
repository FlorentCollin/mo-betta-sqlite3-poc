const Database = require("better-sqlite3");

const dbFile = process.argv[2];
if (!dbFile) {
	console.error("Usage: node read-better-sqlite3.js <database-file>");
	process.exit(1);
}

const db = new Database(dbFile);
db.pragma("journal_mode = MEMORY");
const stmt = db.prepare("SELECT id, name, email, description FROM users");

let count = 0;
let totalLength = 0;

for (const row of stmt.iterate()) {
	count++;
	// Access all string fields to ensure they're processed
	totalLength += row.name.length + row.email.length + row.description.length;
}

db.close();

console.log(`better-sqlite3: Processed ${count} rows, ${totalLength} total string chars`);
