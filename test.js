const { Database } = require('./index.js');
const fs = require('fs');

// Clean up any existing test database
if (fs.existsSync('test.db')) {
    fs.unlinkSync('test.db');
}

try {
    console.log('Creating database...');
    const db = new Database('test.db');

    console.log('Creating table...');
    db.exec('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, email TEXT)');

    console.log('Inserting test data...');
    db.exec("INSERT INTO users (name, email) VALUES ('Alice', 'alice@example.com')");
    db.exec("INSERT INTO users (name, email) VALUES ('Bob', 'bob@example.com')");
    db.exec("INSERT INTO users (name, email) VALUES ('Charlie', 'charlie@example.com')");

    console.log('Preparing SELECT statement...');
    const stmt = db.prepare('SELECT id, name, email FROM users');

    console.log('Testing step() and get() methods:');
    while (stmt.step()) {
        console.log('Row:', {
            id: stmt.get(0),
            name: stmt.get(1),
            email: stmt.get(2)
        });
    }

    console.log('\nTesting iteration with for...of:');
    stmt.reset();
    for (const row of stmt) {
        console.log('Row object:', row);
        console.log('Name type:', typeof row.name);
        console.log('Email length:', row.email.length);
    }

    console.log('\nTesting iterator protocol directly:');
    stmt.reset();
    const iterator = stmt[Symbol.iterator]();
    let result = iterator.next();
    while (!result.done) {
        console.log('Iterator result:', result.value);
        result = iterator.next();
    }

    stmt.finalize();
    db.close();

    console.log('\nTest completed successfully!');

} catch (error) {
    console.error('Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
}
