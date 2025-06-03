const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

// Clean up any existing test database
if (fs.existsSync('benchmark.db')) {
    fs.unlinkSync('benchmark.db');
}

const db = new sqlite3.Database('benchmark.db');

// Use promise wrapper for cleaner async handling
function run(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
}

function all(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

async function benchmark() {
    // Create table and insert test data
    await run(`CREATE TABLE users (
        id INTEGER PRIMARY KEY,
        name TEXT,
        email TEXT,
        description TEXT,
        score REAL,
        active INTEGER
    )`);

    // Insert data
    for (let i = 0; i < 10000; i++) {
        await run(`INSERT INTO users (name, email, description, score, active) VALUES (?, ?, ?, ?, ?)`, [
            `User${i}`,
            `user${i}@example.com`,
            `This is a longer description for user ${i} to test string performance with more substantial text content that will benefit from zero-copy access. Lorem ipsum dolor sit amet, consectetur adipiscing elit.`,
            Math.random() * 100,
            i % 2
        ]);
    }

    // Benchmark: Get all rows
    let count = 0;
    let totalLength = 0;

    console.time('node-sqlite3');
    const rows = await all('SELECT id, name, email, description, score, active FROM users');
    
    for (const row of rows) {
        count++;
        // Process the data to ensure strings are accessed
        totalLength += row.name.length + row.email.length + row.description.length;
    }
    console.timeEnd('node-sqlite3');

    db.close();

    console.log(`Processed ${count} rows, total string length: ${totalLength}`);

    // Clean up
    if (fs.existsSync('benchmark.db')) {
        fs.unlinkSync('benchmark.db');
    }
}

benchmark().catch(console.error);
