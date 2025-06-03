# mo-betta-sqlite3

A high-performance SQLite binding for Node.js designed to eliminate unnecessary string allocations by using V8's external string API with UTF-16 encoding.

## Features

- **Zero-copy string access**: Text columns are accessed directly from SQLite's memory using V8 external strings
- **UTF-16 optimization**: Uses SQLite's UTF-16 mode to match V8's internal string representation
- **Synchronous API**: Similar to better-sqlite3 for maximum performance in tight loops
- **Iterator support**: Full support for `for...of` loops and iterator protocol
- **Node.js 22+ support**: Built specifically for modern Node.js with the latest V8 APIs

## Performance

This library aims for ~10× performance improvement in per-row iteration compared to traditional SQLite bindings by avoiding string copying and UTF-8 to UTF-16 conversion overhead.

## Installation

Prerequisites:
- Node.js 22 or higher
- Python (for node-gyp)
- C++ compiler with C++20 support
- Linux or macOS (Windows not supported)

```bash
npm install
npm run build
```

## Usage

```javascript
const { Database } = require('mo-betta-sqlite3');

// Open database (automatically sets UTF-16 encoding)
const db = new Database('mydb.sqlite');

// Create table and insert data
db.exec('CREATE TABLE users (id INTEGER, name TEXT, email TEXT)');
db.exec("INSERT INTO users VALUES (1, 'Alice', 'alice@example.com')");
db.exec("INSERT INTO users VALUES (2, 'Bob', 'bob@example.com')");

// Prepare and execute queries
const stmt = db.prepare('SELECT id, name, email FROM users');

// Method 1: Manual stepping
while (stmt.step()) {
    console.log(stmt.get('name'), stmt.get('email'));
}

// Method 2: Iterator (recommended for performance)
stmt.reset();
for (const row of stmt) {
    console.log(row.name, row.email); // Zero-copy strings!
}

// Clean up
stmt.finalize();
db.close();
```

## API

### Database

#### `new Database(filename: string)`
Creates a new database connection. The database is automatically configured to use UTF-16 encoding.

#### `prepare(sql: string): Statement`
Prepare a SQL statement for execution.

#### `exec(sql: string): void`
Execute a SQL statement that doesn't return rows.

#### `close(): void`
Close the database connection.

### Statement

#### `step(): boolean`
Advance to the next row. Returns `true` if a row is available, `false` if done.

#### `get(column: number | string): any`
Get a column value from the current row. Text values are returned as zero-copy external strings.

#### `reset(): void`
Reset the statement to be executed again.

#### `finalize(): void`
Finalize the statement and free resources.

#### Iterator Support
Statements implement the iterator protocol and can be used with `for...of`:

```javascript
for (const row of stmt) {
    // Process row
}
```

## Important Notes

### Row Lifecycle
Row objects and their string values are only valid until the next `step()` call or statement finalization. If you need to retain data beyond iteration, make explicit copies:

```javascript
const rows = [];
for (const row of stmt) {
    // This is UNSAFE - strings become invalid after next iteration
    rows.push(row);
    
    // This is SAFE - creates proper copies
    rows.push({
        id: row.id,
        name: String(row.name),  // explicit copy
        email: String(row.email) // explicit copy
    });
}
```

### UTF-16 Requirement
This library sets `PRAGMA encoding = 'UTF-16'` on database connections. Existing databases with UTF-8 encoding will work, but new text data will be stored as UTF-16 for optimal performance.

## Testing

```bash
npm test
```

## Platform Support

- ✅ Linux
- ✅ macOS  
- ❌ Windows (not supported in this proof-of-concept)

## Performance Comparison

TODO: Add benchmarks comparing against better-sqlite3 and other SQLite bindings.

## License

MIT
