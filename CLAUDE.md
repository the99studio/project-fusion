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
- **Node.js 18+**, **pnpm** package manager
- **Zod 4.0.17** (schema validation), **Commander.js 14** (CLI)
- **fs-extra**, **glob**, **ignore**, **chalk**, **clipboardy**, **uuid**

## Commands & Development

### Development Commands
```bash
pnpm install        # Install dependencies
pnpm build          # Build project
pnpm dev            # Watch mode compilation
pnpm typecheck      # Type checking
pnpm clean          # Clean artifacts
pnpm link --global  # Link CLI globally
```

### CLI Commands
```bash
project-fusion init     # Initialize configuration
project-fusion fusion   # Create fusion file
project-fusion --help   # Show help
```

### Development Workflow
1. Clone repo → `pnpm install` → `pnpm build` → `pnpm link --global`
2. Edit `src/` files → `pnpm build` → test with linked CLI
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

## Fusion File Format
```
# Generated Project Fusion File
# Project: name @2025-01-15T10:30:00.000Z Files: 5

### /src/component.tsx
# Hash: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
[file content here]

### /src/utils.ts  
# Hash: f8c3bf28b236ed1d3644dd5b66728c3413679c7e6efcb2a79da143e9c6bb19d0
[file content here]
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
3. Generate SHA-256 hash per file + combine into fusion format
4. Write to `.project-fusion/fusion/project_files_fusioned.txt`
5. Optionally copy to clipboard

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
2. `pnpm build` → `npm pack --dry-run` → `npm publish`
3. Published: `dist/` directory as `project-fusion` package

## Recent Improvements (2025)
### ✅ State-of-the-Art TypeScript
- Branded types (FilePath, FileHash), discriminated unions
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