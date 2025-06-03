# mo-betta-sqlite3 Development Notes

## Build Commands
- `npm run build` - Build the native addon using node-gyp
- `npm run clean` - Clean build artifacts
- `npm test` - Run basic functionality tests
- `node benchmark.js` - Run performance benchmarks

## Architecture

This is a high-performance SQLite binding for Node.js that eliminates string copying overhead through:

1. **UTF-16 Database Encoding**: Uses `PRAGMA encoding = 'UTF-16'` to match V8's internal string representation
2. **External Strings**: Text columns are exposed as V8 external strings that reference SQLite's memory directly
3. **Zero-Copy Access**: No string copying or encoding conversion for text data
4. **Synchronous API**: Similar to better-sqlite3 for maximum performance

## Key Implementation Details

### External String Strategy
- Uses `v8::String::ExternalStringResource` for UTF-16 text data
- `sqlite3_column_text16()` provides UTF-16 data compatible with V8
- External strings reference SQLite memory without copying
- Simplified compared to ASCII-check approach in original plan

### Row Lifecycle
- Row objects are ephemeral (valid only until next `step()`)
- External strings become invalid when SQLite frees the memory
- Users must explicitly copy data if retention beyond iteration is needed

### Platform Support
- Linux and macOS supported
- Windows explicitly excluded in binding.gyp
- Requires Node.js 22+ for modern V8 APIs
- C++20 compiler required

## Performance Results
- Achieves >2M rows/second iteration performance
- Zero-copy string access for text columns
- UTF-16 encoding eliminates conversion overhead
- Synchronous API avoids async overhead

## Files Structure
- `src/addon.cpp` - Module initialization
- `src/database.cpp/.h` - Database class implementation
- `src/statement.cpp/.h` - Statement class with iteration support
- `src/external_string.cpp/.h` - V8 external string resource
- `binding.gyp` - Build configuration
- `index.d.ts` - TypeScript definitions

## Testing
Basic test in `test.js` covers:
- Database creation with UTF-16 encoding
- Table creation and data insertion
- Statement preparation and execution
- Both step/get and iterator access patterns
- Memory cleanup (finalize/close)

Performance benchmark in `benchmark.js` demonstrates:
- High-throughput row processing
- String access patterns with external strings
- Comparison between access methods
