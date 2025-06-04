const Database = require('better-sqlite3');
const fs = require('fs');

// Clean up any existing test database
if (fs.existsSync('benchmark.db')) {
    fs.unlinkSync('benchmark.db');
}

console.log('Setting up benchmark database with 50,000 rows...');

const db = new Database('benchmark.db');
db.pragma(`encoding = "UTF-16"`);
db.pragma(`journal_mode = WAL`);

// Create table
db.exec(`CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    name TEXT,
    email TEXT,
    description TEXT,
    score REAL,
    active INTEGER
)`);

// Insert data efficiently
const insert = db.prepare(`INSERT INTO users (name, email, description, score, active) VALUES (?, ?, ?, ?, ?)`);

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
        Math.random() * 100,
        i % 2
    ]);
}

insertMany(users);
db.close();

console.log('Benchmark database created with 50,000 rows');
