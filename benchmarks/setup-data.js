const Database = require("better-sqlite3");
const fs = require("fs");

// Clean up any existing test databases
if (fs.existsSync("benchmark-utf16.db")) {
	fs.unlinkSync("benchmark-utf16.db");
}
if (fs.existsSync("benchmark-utf8.db")) {
	fs.unlinkSync("benchmark-utf8.db");
}

console.log("Setting up benchmark databases with 50,000 rows each...");

function createDatabase(filename, useUtf16) {
	const db = new Database(filename);
	if (useUtf16) {
		db.pragma(`encoding = "UTF-16"`);
	}
	db.pragma(`journal_mode = MEMORY`);
	return db;
}

function setupDatabase(db) {
	// Create table
	db.exec(`CREATE TABLE users (
		id INTEGER PRIMARY KEY,
		name TEXT,
		email TEXT,
		description TEXT
	)`);

	// Insert data efficiently
	const insert = db.prepare(`INSERT INTO users (name, email, description) VALUES (?, ?, ?)`);

	const insertMany = db.transaction((users) => {
		for (const user of users) {
			insert.run(user);
		}
	});

	// Generate test data
	const users = [];
	for (let i = 0; i < 50000; i++) {
		users.push([
			`User${i}`,
			`user${i}@example.com`,
			`This is a longer description for user ${i} to test string performance with more substantial text content that will benefit from zero-copy access. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. This is a longer description for user ${i} to test string performance with more substantial text content that will benefit from zero-copy access. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. This is a longer description for user ${i} to test string performance with more substantial text content that will benefit from zero-copy access. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. This is a longer description for user ${i} to test string performance with more substantial text content that will benefit from zero-copy access. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. This is a longer description for user ${i} to test string performance with more substantial text content that will benefit from zero-copy access. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. This is a longer description for user ${i} to test string performance with more substantial text content that will benefit from zero-copy access. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. This is a longer description for user ${i} to test string performance with more substantial text content that will benefit from zero-copy access. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. This is a longer description for user ${i} to test string performance with more substantial text content that will benefit from zero-copy access. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. This is a longer description for user ${i} to test string performance with more substantial text content that will benefit from zero-copy access. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.  `,
		]);
	}

	insertMany(users);
	db.close();
}

// Create UTF-16 database
console.log("Creating UTF-16 database...");
const dbUtf16 = createDatabase("benchmark-utf16.db", true);
setupDatabase(dbUtf16);

// Create UTF-8 database
console.log("Creating UTF-8 database...");
const dbUtf8 = createDatabase("benchmark-utf8.db", false);
setupDatabase(dbUtf8);

console.log("Both benchmark databases created with 50,000 rows each");
