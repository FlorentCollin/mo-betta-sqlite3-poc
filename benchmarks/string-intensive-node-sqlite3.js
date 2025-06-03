const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('benchmark.db');

function all(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

async function benchmark() {
    const rows = await all('SELECT id, name, email, description, score, active FROM users');
    
    let count = 0;
    let processedData = 0;
    
    for (const row of rows) {
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

    db.close();
    
    console.log(`node-sqlite3: Processed ${count} rows, ${processedData} chars of processed string data`);
}

benchmark().catch(console.error);
