const { Database } = require('./index.js');
const fs = require('fs');

// Clean up any existing test database
if (fs.existsSync('benchmark.db')) {
    fs.unlinkSync('benchmark.db');
}

console.log('Creating benchmark database with UTF-16 encoding...');
const db = new Database('benchmark.db');

console.log('Creating table and inserting test data...');
db.exec(`CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    name TEXT,
    email TEXT,
    description TEXT
)`);

// Insert 10,000 rows of test data
const insertStmt = db.prepare('INSERT INTO users (name, email, description) VALUES (?, ?, ?)');
console.log('Preparing to insert 10,000 rows...');

for (let i = 0; i < 10000; i++) {
    db.exec(`INSERT INTO users (name, email, description) VALUES (
        'User${i}',
        'user${i}@example.com',
        'This is a longer description for user ${i} to test string performance with more substantial text content that will benefit from zero-copy access.'
    )`);
}

console.log('Data insertion complete. Running benchmarks...\n');

// Benchmark: Traditional step/get approach
console.log('=== Benchmark 1: step() + get() method ===');
const stmt1 = db.prepare('SELECT id, name, email, description FROM users');
let count1 = 0;
const start1 = process.hrtime.bigint();

while (stmt1.step()) {
    const id = stmt1.get(0);
    const name = stmt1.get(1);
    const email = stmt1.get(2);
    const description = stmt1.get(3);
    count1++;
    // Do minimal processing to avoid optimization
    if (typeof name === 'string' && name.length > 0) {
        // Just access the string to ensure it's processed
    }
}

const end1 = process.hrtime.bigint();
const time1 = Number(end1 - start1) / 1_000_000; // Convert to milliseconds
stmt1.finalize();

console.log(`Processed ${count1} rows in ${time1.toFixed(2)}ms`);
console.log(`Rate: ${(count1 / (time1 / 1000)).toFixed(0)} rows/second`);
console.log(`Per-row time: ${(time1 / count1).toFixed(3)}ms\n`);

// Benchmark: Iterator approach (recommended)
console.log('=== Benchmark 2: for...of iterator ===');
const stmt2 = db.prepare('SELECT id, name, email, description FROM users');
let count2 = 0;
const start2 = process.hrtime.bigint();

for (const row of stmt2) {
    count2++;
    // Access all fields to ensure strings are processed
    if (typeof row.name === 'string' && row.name.length > 0 &&
        typeof row.email === 'string' && row.email.length > 0 &&
        typeof row.description === 'string' && row.description.length > 0) {
        // Just access the strings to ensure they're processed
    }
}

const end2 = process.hrtime.bigint();
const time2 = Number(end2 - start2) / 1_000_000; // Convert to milliseconds
stmt2.finalize();

console.log(`Processed ${count2} rows in ${time2.toFixed(2)}ms`);
console.log(`Rate: ${(count2 / (time2 / 1000)).toFixed(0)} rows/second`);
console.log(`Per-row time: ${(time2 / count2).toFixed(3)}ms\n`);

// Benchmark: String access pattern (external strings)
console.log('=== Benchmark 3: String concatenation test ===');
const stmt3 = db.prepare('SELECT name, email, description FROM users LIMIT 1000');
let totalLength = 0;
const start3 = process.hrtime.bigint();

for (const row of stmt3) {
    // This tests the actual string data access with external strings
    const combined = row.name + ' - ' + row.email + ': ' + row.description;
    totalLength += combined.length;
}

const end3 = process.hrtime.bigint();
const time3 = Number(end3 - start3) / 1_000_000;
stmt3.finalize();

console.log(`Processed 1000 rows with string operations in ${time3.toFixed(2)}ms`);
console.log(`Total string length processed: ${totalLength} characters`);
console.log(`Rate: ${(1000 / (time3 / 1000)).toFixed(0)} rows/second\n`);

db.close();

console.log('=== Summary ===');
console.log('This benchmark demonstrates the high-performance SQLite binding');
console.log('using UTF-16 encoding and zero-copy external strings.');
console.log('');
console.log('Key features demonstrated:');
console.log('- UTF-16 database encoding for V8 compatibility');
console.log('- Zero-copy string access using V8 external strings');
console.log('- Synchronous API for maximum performance');
console.log('- Iterator support for ergonomic usage');

// Clean up
if (fs.existsSync('benchmark.db')) {
    fs.unlinkSync('benchmark.db');
}
