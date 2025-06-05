import { Database } from "bun:sqlite";

const dbFile = process.argv[2];
if (!dbFile) {
	console.error("Usage: bun read-bun.js <database-file>");
	process.exit(1);
}

const db = new Database(dbFile);
db.exec("PRAGMA journal_mode = MEMORY");

const stmt = db.query("SELECT id, name, email, description FROM users");

let count = 0;
let totalLength = 0;

// Use stmt.all() if the dataset is small, or iterate via stmt.iterate()
for (const row of stmt.iterate()) {
	count++;
	// Access string fields
	totalLength += row.name.length + row.email.length + row.description.length;
}

db.close();

console.log(`bun:sqlite: Processed ${count} rows, ${totalLength} total string chars`);
