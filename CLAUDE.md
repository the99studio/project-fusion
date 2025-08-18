# Project Fusion - AI Context

> 📖 **For Human Development**: See [DEVELOPMENT.md](./DEVELOPMENT.md) for workflows, testing, and npm publication.

## Project Overview
CLI tool that merges project files into single .txt/.md/.html fusion files for easy sharing and AI collaboration.

## Essential Architecture
- **TypeScript 5.9.2** ESM project with strict type checking
- **CLI** built with Commander.js generating .txt/.md/.html files
- **Configuration-driven** with Zod validation and defaults
- **Multi-format output** with syntax highlighting

## Core Files
```
src/
├── api.ts              # Programmatic API
├── benchmark.ts        # Performance tracking
├── cli.ts              # CLI entry point
├── clicommands.ts      # Command implementations  
├── fluent.ts           # Fluent API
├── fusion.ts           # Core fusion logic
├── index.ts            # Main exports
├── schema.ts           # Zod validation schemas
├── types.ts            # Type definitions (branded types)
├── utils.ts            # File operations & utilities
├── adapters/file-system.ts    # File system abstraction
├── plugins/plugin-system.ts   # Plugin architecture
└── strategies/output-strategy.ts # Output format strategies
```

## Commands
```bash
npm run build           # Build TypeScript → JavaScript
npm run typecheck       # Type checking only
project-fusion init     # Initialize config
project-fusion          # Run fusion process
```

## Testing Directory
**⚠️ Important**: All testing/temporary files MUST go in `temp/` directory (gitignored).
- Package testing: `temp/package/`
- File tests: `temp/test-files/`
- Artifacts: `temp/artifacts/`

## Config Schema (Essential Fields)
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
    backend: string[]   // .cs, .go, .java, .php, .py, .rb, .rs
    config: string[]    // .json, .toml, .xml, .yaml, .yml
    cpp: string[]       // .c, .cc, .cpp, .h, .hpp
    doc: string[]       // .adoc, .md, .rst
    godot: string[]     // .cfg, .cs, .gd, .import, .tscn, .tres
    scripts: string[]   // .bat, .cmd, .ps1, .sh
    web: string[]       // .css, .html, .js, .jsx, .svelte, .ts, .tsx, .vue
  }
  parseSubDirectories: boolean
  rootDirectory: string
  schemaVersion: 1
  useGitIgnoreForExcludes: boolean
}
```

## Core Workflow
1. Load/validate `project-fusion.json` config (Zod schema)
2. Scan files by extensions, apply .gitignore + ignore patterns
3. Generate outputs:
   - `.txt` - Plain text with separators
   - `.md` - Markdown with syntax highlighting + TOC
   - `.html` - Responsive design + interactive TOC

## Implementation Details
- **Branded types** (FilePath) prevent string confusion
- **Discriminated unions** (FusionResult) for type-safe error handling  
- **ESM modules** with strict TypeScript
- **Plugin system** for extensibility
- **Output strategies** for different formats
- **File system adapters** for testability

## Quick Reference
- **Add extensions**: Update `src/schema.ts` + `src/utils.ts`
- **Add commands**: Register in `src/cli.ts`, implement in `src/clicommands.ts`
- **Modify output**: Edit output strategies in `src/strategies/`
- **Add plugins**: Use plugin system in `src/plugins/`

## Documentation Style
- Keep it simple and factual
- Use neutral tone, avoid marketing language
- No excessive adjectives or superlatives