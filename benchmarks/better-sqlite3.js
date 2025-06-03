const Database = require('better-sqlite3');
const fs = require('fs');

// Clean up any existing test database
if (fs.existsSync('benchmark.db')) {
    fs.unlinkSync('benchmark.db');
}

const db = new Database('benchmark.db');

// Create table and insert test data
db.exec(`CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    name TEXT,
    email TEXT,
    description TEXT,
    score REAL,
    active INTEGER
)`);

// Insert data
const insert = db.prepare(`INSERT INTO users (name, email, description, score, active) VALUES (?, ?, ?, ?, ?)`);
for (let i = 0; i < 10000; i++) {
    insert.run(
        `User${i}`,
        `user${i}@example.com`,
        `This is a longer description for user ${i} to test string performance with more substantial text content that will benefit from zero-copy access. Lorem ipsum dolor sit amet, consectetur adipiscing elit.`,
        Math.random() * 100,
        i % 2
    );
}

// Benchmark: Iterator approach
const stmt = db.prepare('SELECT id, name, email, description, score, active FROM users');
let count = 0;
let totalLength = 0;

console.time('better-sqlite3');
for (const row of stmt.iterate()) {
    count++;
    // Process the data to ensure strings are accessed
    totalLength += row.name.length + row.email.length + row.description.length;
}
console.timeEnd('better-sqlite3');

db.close();

console.log(`Processed ${count} rows, total string length: ${totalLength}`);

// Clean up
if (fs.existsSync('benchmark.db')) {
    fs.unlinkSync('benchmark.db');
}
