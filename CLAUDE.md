# Project Fusion - Developer Guide

## Project Overview
Project Fusion merges multiple project files into a single file for easy sharing and collaboration.

## Project Structure
```
project-fusion/
├── src/                        # Source code
│   ├── cli.ts                  # CLI entry point (Commander.js)
│   ├── clicommands.ts          # Command implementations
│   ├── fusion.ts               # Core fusion functionality  
│   ├── types.ts                # TypeScript definitions (branded types)
│   ├── schema.ts               # Zod configuration schemas
│   ├── utils.ts                # Utilities (file ops, config, logging)
│   └── index.ts                # Main exports
├── project-fusion.json         # Configuration file
└── package.json                # Dependencies and scripts
```

## Technology Stack
- **TypeScript 5.9.2** (ES2022, NodeNext, strict mode)
- **Node.js 18+**, **npm** package manager
- **Zod 4.0.17** (schema validation), **Commander.js 14** (CLI)
- **fs-extra**, **glob**, **ignore**, **chalk**, **clipboardy**

## Commands & Development

### Development Commands
```bash
npm install        # Install dependencies
npm run build      # Build project
npm run dev        # Watch mode compilation
npm run typecheck  # Type checking
npm run clean      # Clean artifacts
npm link           # Link CLI globally
```

### CLI Commands
```bash
project-fusion init     # Initialize configuration
project-fusion fusion   # Create fusion file
project-fusion --help   # Show help
```

### Development Workflow
1. Clone repo → `npm install` → `npm run build` → `npm link`
2. Edit `src/` files → `npm run build` → test with linked CLI
3. Test in sample project: `project-fusion init` → `project-fusion fusion`

## Configuration Schema
```typescript
{
  schemaVersion: number
  fusion: {
    fusion_file: string
    fusion_log: string  
    copyToClipboard?: boolean
  }
  parsedFileExtensions: {
    web: string[]      // .js, .ts, .tsx, .vue, etc.
    backend: string[]  // .py, .go, .java, .rs, etc.
    config: string[]   // .json, .yaml, .toml, etc.
    cpp: string[]      // .c, .cpp, .h, .hpp
    scripts: string[]  // .sh, .bat, .ps1
    godot: string[]    // .gd, .tscn, .tres
  }
  parsing: { rootDirectory: string, parseSubDirectories: boolean }
  ignorePatterns: string[]
  useGitIgnoreForExcludes: boolean
  useProjectFusionIgnoreForExcludes: boolean
}
```

## Fusion File Formats

### Plain Text Format (.txt)
```
# Generated Project Fusion File
# Project: name @2025-01-15T10:30:00.000Z
# Files: 5

<!-- ============================================================ -->
<!-- FILE: /src/component.tsx                                     -->
<!-- ============================================================ -->
[file content here]

<!-- ============================================================ -->
<!-- FILE: /src/utils.ts                                          -->
<!-- ============================================================ -->
[file content here]
```

### Markdown Format (.md)
```markdown
# Generated Project Fusion File
**Project:** name
**Generated:** 2025-01-15T10:30:00.000Z
**Files:** 5

## 📁 Table of Contents
- [/src/component.tsx](#src-component-tsx)
- [/src/utils.ts](#src-utils-ts)

## 📄 /src/component.tsx
```tsx
[file content with syntax highlighting]
```

## 📄 /src/utils.ts
```typescript
[file content with syntax highlighting]
```
```

## Architecture Patterns
- **ESM modules** with NodeNext resolution
- **Branded types** (FilePath, FileHash) for type safety
- **Discriminated unions** for FusionResult (success/failure)
- **Zod runtime validation**, **async/await throughout**
- **Separation of concerns**: CLI ↔ core logic ↔ utilities

## File Processing Flow
1. Load `project-fusion.json` config (Zod validation)
2. Scan directory by file extensions + apply ignore rules
3. Process each file and extract content
4. Generate two output formats:
   - `project-fusioned.txt` - Plain text with HTML-style separators
   - `project-fusioned.md` - Markdown with syntax highlighting and TOC
5. Optionally copy to clipboard (disabled by default)

## Common Development Tasks

### Add File Extension
1. Update `src/schema.ts` parsedFileExtensions
2. Update default config in `src/utils.ts`

### Add CLI Command  
1. Register in `src/cli.ts` (Commander.js)
2. Implement in `src/clicommands.ts`

### Modify Fusion Format
1. Edit `src/fusion.ts` processing logic
2. Update types in `src/types.ts`

## Security & .projectfusionignore
```
# Example .projectfusionignore
.env*
**/credentials/*
**/secrets/*
*.pem
*.key
package-lock.json
/.project-fusion/
```
Enable: `"useProjectFusionIgnoreForExcludes": true`

## NPM Publication
1. Update version in `package.json`
2. `npm run build` → `npm pack --dry-run` → `npm publish`
3. Published: `dist/` directory as `project-fusion` package

## Features

### Dual Output Formats
- **Plain Text (.txt)**: Universal compatibility with clear separators
- **Markdown (.md)**: Enhanced readability with:
  - Syntax highlighting for 50+ file types
  - Clickable table of contents
  - Organized sections with icons
  - Automatic language detection for code blocks

### Smart File Processing
- Ignores patterns from `.gitignore` (configurable)
- Custom ignore patterns in `project-fusion.json`
- Organized file extensions by category
- Efficient filtering with detailed statistics

## Recent Improvements (2025)
### ✅ State-of-the-Art TypeScript
- Branded types (FilePath), discriminated unions
- `const assertions`, `satisfies` operator, ~95% type coverage
- Zero `any` types, async `loadConfig()`, unified type definitions

### ✅ Code Quality  
- Dead code eliminated, TypeScript 5.9.2, Zod 4.0.17
- All packages updated, zero warnings/errors

## Performance & Limitations
- **Large files**: Configure extensions/exclusions appropriately
- **Memory**: File size limited by available memory
- **Text only**: No binary file support
- **Paths**: UTF-8 encoding, cross-platform path handling

## Debugging Tips
- Check `.project-fusion/fusion/fusion.log`
- Verify config with Zod validation
- Test with small file sets first
- Use specific extension groups for large projects