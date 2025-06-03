const { Database } = require('../index.js');

const db = new Database('benchmark.db');
const stmt = db.prepare('SELECT id, name, email, description, score, active FROM users');

let count = 0;
let processedData = 0;

for (const row of stmt) {
    count++;
    
    // Intensive string processing that would benefit from zero-copy
    const combined = row.name + ' | ' + row.email + ' | ' + row.description;
    const uppercase = combined.toUpperCase();
    const words = uppercase.split(' ');
    const filtered = words.filter(word => word.length > 3);
    const rejoined = filtered.join('-');
    
    processedData += rejoined.length;
    
    // More string operations
    if (row.description.includes('Lorem')) {
        const index = row.description.indexOf('Lorem');
        const substr = row.description.substring(index, index + 20);
        processedData += substr.length;
    }
}

stmt.finalize();
db.close();

console.log(`mo-betta-sqlite3: Processed ${count} rows, ${processedData} chars of processed string data`);
