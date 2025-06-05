const { Database } = require("../index.js");

const dbFile = process.argv[2];
if (!dbFile) {
	console.error("Usage: node read-mo-betta.js <database-file>");
	process.exit(1);
}

const db = new Database(dbFile);
db.exec("PRAGMA journal_mode = MEMORY");
const stmt = db.prepare("SELECT id, name, email, description FROM users");

let count = 0;
let totalLength = 0;

for (const row of stmt) {
	count++;
	// Access all string fields to ensure they're processed
	totalLength += row.name.length + row.email.length + row.description.length;
}

stmt.finalize();
db.close();

console.log(`mo-betta-sqlite3: Processed ${count} rows, ${totalLength} total string chars`);
