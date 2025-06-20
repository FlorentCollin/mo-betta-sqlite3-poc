const { Database } = require("./index.js");
const fs = require("fs");

// Clean up test database
if (fs.existsSync("test.db")) {
    fs.unlinkSync("test.db");
}

console.log("Testing UTF-16 string handling...");

function testBasicFunctionality() {
    console.log("1. Testing basic database creation and UTF-16 encoding...");
    
    const db = new Database("test.db");
    
    // Test table creation with UTF-16
    db.exec("CREATE TABLE test (id INTEGER PRIMARY KEY, text TEXT)");
    
    // Test UTF-16 characters insertion using exec
    const testStrings = [
        "Hello World",
        "日本語", 
        "Émojis: 🎉🌟✨",
        "Русский текст",
        "العربية",
        "Mixed: Hello 世界 🌍"
    ];
    
    testStrings.forEach((str, index) => {
        // Use exec for insertion since binding isn't implemented yet
        db.exec(`INSERT INTO test (text) VALUES ('${str.replace(/'/g, "''")}')`);
    });
    
    // Test retrieval
    const selectStmt = db.prepare("SELECT * FROM test");
    let count = 0;
    
    for (const row of selectStmt) {
        console.log(`  Row ${row.id}: ${row.text}`);
        
        // Verify the string matches what we inserted
        if (row.text === testStrings[count]) {
            console.log(`    ✅ String ${count + 1} matches`);
        } else {
            console.log(`    ❌ String ${count + 1} mismatch: expected "${testStrings[count]}", got "${row.text}"`);
        }
        count++;
    }
    
    selectStmt.finalize();
    db.close();
    
    console.log(`  Processed ${count} UTF-16 strings successfully\n`);
}

function testDatabaseEncoding() {
    console.log("2. Testing database encoding verification...");
    
    const db = new Database("test-encoding.db");
    
    // Check the encoding pragma
    const stmt = db.prepare("PRAGMA encoding");
    let result = null;
    
    for (const row of stmt) {
        result = row;
        break;
    }
    
    stmt.finalize();
    
    console.log(`  Database encoding: ${result.encoding}`);
    
    if (result.encoding === "UTF-16le" || result.encoding === "UTF-16be") {
        console.log("  ✅ UTF-16 encoding set correctly");
    } else {
        console.log("  ❌ UTF-16 encoding not set correctly");
    }
    
    db.close();
    fs.unlinkSync("test-encoding.db");
    console.log();
}

function testErrorHandling() {
    console.log("3. Testing error handling...");
    
    const db = new Database("test-error.db");
    
    try {
        // Test invalid SQL
        db.exec("INVALID SQL STATEMENT");
        console.log("  ❌ Should have thrown an error");
    } catch (error) {
        console.log("  ✅ Error handling works:", error.message);
    }
    
    try {
        // Test invalid prepared statement
        db.prepare("INVALID SQL");
        console.log("  ❌ Should have thrown an error");
    } catch (error) {
        console.log("  ✅ Prepare error handling works:", error.message);
    }
    
    db.close();
    fs.unlinkSync("test-error.db");
    console.log();
}

function testLargeStrings() {
    console.log("4. Testing large UTF-16 strings...");
    
    // Clean up if exists
    if (fs.existsSync("test-large.db")) {
        fs.unlinkSync("test-large.db");
    }
    
    const db = new Database("test-large.db");
    db.exec("CREATE TABLE large_test (id INTEGER PRIMARY KEY, large_text TEXT)");
    
    // Create a large string with UTF-16 characters
    const largeString = "🌟".repeat(1000) + "日本語テスト".repeat(100);
    
    // Use exec for insertion
    db.exec(`INSERT INTO large_test (large_text) VALUES ('${largeString.replace(/'/g, "''")}')`);;
    
    const selectStmt = db.prepare("SELECT large_text FROM large_test WHERE id = 1");
    let result = null;
    
    for (const row of selectStmt) {
        result = row;
        break;
    }
    
    selectStmt.finalize();
    
    if (result.large_text === largeString) {
        console.log(`  ✅ Large UTF-16 string (${largeString.length} chars) handled correctly`);
    } else {
        console.log(`  ❌ Large UTF-16 string mismatch`);
    }
    
    db.close();
    fs.unlinkSync("test-large.db");
    console.log();
}

// Run all tests
try {
    testBasicFunctionality();
    testDatabaseEncoding();
    testErrorHandling();
    testLargeStrings();
    
    console.log("🎉 All UTF-16 tests completed!");
    
} catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error(error.stack);
    process.exit(1);
} finally {
    // Cleanup
    if (fs.existsSync("test.db")) {
        fs.unlinkSync("test.db");
    }
}
