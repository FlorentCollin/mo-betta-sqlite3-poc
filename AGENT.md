# Agent Instructions for mo-betta-sqlite3

## Build/Test Commands
- Build: `bun run build` (compiles C++ addon with node-gyp)
- Clean: `bun run clean` (removes build artifacts)
- Test: `bun test` (runs test.js - though test.js doesn't exist yet)
- Rebuild: `node-gyp rebuild` (direct rebuild command)

## Code Style Guidelines

### JavaScript
- Use CommonJS modules (`require`/`module.exports`)
- Prefer `const` over `let`, avoid `var`
- Use double quotes for strings
- Use tabs for indentation (observed in benchmarks)
- Camel case for variables and functions

### TypeScript Definitions
- Use JSDoc comments for parameters and return types
- Export types and classes explicitly
- Use union types for flexible parameters (e.g., `number | string`)

### C++
- Use C++20 standard
- Include V8 and Node.js headers with angle brackets
- Use `using` declarations for common V8 types
- Follow class-based module structure with `Init` methods

### Error Handling
- No explicit error handling patterns observed - add appropriate try/catch for JS and error checking for C++

## Architecture Notes
- Native C++ addon using node-gyp build system
- Supports UTF-16 encoding optimization for V8 string performance
- Requires Node.js 22+ and C++20 compiler
- Linux/macOS only (Windows explicitly not supported)
