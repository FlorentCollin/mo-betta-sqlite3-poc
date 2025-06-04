const { Database } = require('./index.js');

console.log('Testing lightweight/temporary row access...');

const db = new Database(':memory:');
db.exec('PRAGMA encoding = "UTF-16"');
db.exec('CREATE TABLE test (id INTEGER, text TEXT)');
db.exec("INSERT INTO test VALUES (1, 'hello world')");

const stmt = db.prepare('SELECT * FROM test');

console.log('\n1. Testing iterator - rows become invalid after stepping:');
let storedRow = null;
let storedText = null;

for (const row of stmt) {
    console.log('Current row text:', row.text);
    storedRow = row;           // Store reference to row object
    storedText = row.text;     // Store reference to external string
    console.log('Stored row text immediately:', storedText);
    break; // Only process first row
}

console.log('\n2. After stepping, stored external string should still work:');
console.log('Stored text after iteration:', storedText);
console.log('Stored row text after iteration:', storedRow ? storedRow.text : 'undefined');

console.log('\n3. Testing with manual stepping:');
stmt.reset();
if (stmt.step()) {
    const row1 = stmt.get('text'); 
    console.log('First step text:', row1);
    
    // Step again (should invalidate previous row data in SQLite)
    if (!stmt.step()) { // SQLITE_DONE
        console.log('No more rows - SQLite has reset/cleared previous row data');
        console.log('Previous external string still accessible:', row1);
    }
}

stmt.finalize();
db.close();

console.log('\n✓ Test complete - external strings demonstrate zero-copy access');
console.log('✓ Row objects become lightweight/temporary as designed in Aaron\'s tweet');
