# Project Fusion - AI Context

> 📖 **Human Dev**: See [DEVELOPMENT.md](./DEVELOPMENT.md)

## Overview
CLI tool merging project files into .txt/.md/.html fusion files for AI collaboration.

## Architecture
- **TypeScript 5.9.2** ESM with strict checking
- **CLI** via Commander.js 
- **Zod** config validation
- **Multi-format** output with syntax highlighting

## Core Files
```
src/
├── api.ts              # Programmatic API
├── benchmark.ts        # Performance tracking  
├── cli.ts              # CLI entry
├── clicommands.ts      # Commands
├── fluent.ts           # Fluent API
├── fusion.ts           # Core logic
├── index.ts            # Exports
├── schema.ts           # Zod schemas
├── types.ts            # TypeScript types
├── utils.ts            # Utilities
├── adapters/file-system.ts    # File abstraction
├── plugins/plugin-system.ts   # Plugin system
└── strategies/output-strategy.ts # Output formats
```

## Commands
```bash
npm run build           # Build TS → JS
npm run typecheck       # Type check
project-fusion init     # Initialize
project-fusion          # Run fusion
```

## Testing
**⚠️ All temp files**: `temp/` directory (gitignored)

## Config (Key Fields)
```typescript
{
  allowSymlinks: boolean
  copyToClipboard: boolean  
  generatedFileName: string
  generateHtml: boolean
  generateMarkdown: boolean
  generateText: boolean
  ignorePatterns: string[]
  maxFileSizeKB: number
  maxFiles: number
  maxTotalSizeMB: number
  parsedFileExtensions: {
    backend: [".cs", ".go", ".java", ".php", ".py", ".rb", ".rs"]
    config: [".json", ".toml", ".xml", ".yaml", ".yml"]
    cpp: [".c", ".cc", ".cpp", ".h", ".hpp"]
    doc: [".adoc", ".md", ".rst"]  
    godot: [".cfg", ".cs", ".gd", ".import", ".tscn", ".tres"]
    scripts: [".bat", ".cmd", ".ps1", ".sh"]
    web: [".css", ".html", ".js", ".jsx", ".svelte", ".ts", ".tsx", ".vue"]
  }
  parseSubDirectories: boolean
  rootDirectory: string
  schemaVersion: 1
  useGitIgnoreForExcludes: boolean
}
```

## Workflow
1. Load/validate config (Zod)
2. Scan files by extensions + apply ignore patterns  
3. Generate: `.txt` (plain), `.md` (syntax+TOC), `.html` (responsive+TOC)

## Key Patterns
- **Branded types** (FilePath) - type safety
- **Discriminated unions** (FusionResult) - error handling
- **Plugin system** - extensibility  
- **Output strategies** - format handling
- **File adapters** - testability

## Quick Edits
- **Extensions**: `src/schema.ts` + `src/utils.ts`
- **Commands**: `src/cli.ts` + `src/clicommands.ts`  
- **Output**: `src/strategies/output-strategy.ts`
- **Plugins**: `src/plugins/plugin-system.ts`