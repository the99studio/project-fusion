# Project Fusion - AI Context

> 📖 **For Human Development**: See [DEVELOPMENT.md](./DEVELOPMENT.md) for detailed development workflows, testing procedures, and npm publication guide.

## Project Overview
Project Fusion merges multiple project files into a single file for easy sharing and collaboration.

## Essential Architecture
- **TypeScript 5.9.2** ESM project with strict type checking
- **CLI tool** built with Commander.js that generates .txt, .md, and .html fusion files
- **Configuration-driven** with Zod validation and default fallbacks
- **Multi-format output** with syntax highlighting and filtering

## Core Files Structure
```
src/
├── cli.ts              # CLI entry point
├── clicommands.ts      # Command implementations  
├── fusion.ts           # Core fusion logic
├── types.ts            # Type definitions (branded types)
├── schema.ts           # Zod validation schemas
├── utils.ts            # File operations & utilities
└── index.ts            # Main exports
```

## Key Commands
```bash
npm run build           # Build TypeScript → JavaScript
npm run typecheck       # Type checking only
project-fusion init     # Initialize config
project-fusion          # Run fusion process
```

## Testing Directory
**⚠️ Important**: All testing and temporary files MUST be created in `temp/` directory at project root. This includes:
- Package testing: `temp/package/`
- File generation tests: `temp/test-files/`
- Any temporary artifacts: `temp/artifacts/`

The `temp/` directory is gitignored and safe for any testing activities.

## Configuration Schema
```typescript
{
  schemaVersion: 1
  copyToClipboard: boolean
  generatedFileName: string
  generateHtml: boolean
  generateMarkdown: boolean
  generateText: boolean
  maxFileSizeKB: number
  parseSubDirectories: boolean
  parsedFileExtensions: {
    web: string[]       // .js, .ts, .tsx, .vue, etc.
    backend: string[]   // .py, .go, .java, .rs, etc. 
    config: string[]    // .json, .yaml, .toml, etc.
    cpp: string[]       // .c, .cpp, .h, .hpp
    scripts: string[]   // .sh, .bat, .ps1
    godot: string[]     // .gd, .tscn, .tres
    doc: string[]       // .md, .rst, .adoc
  }
  rootDirectory: string
  ignorePatterns: string[]
  useGitIgnoreForExcludes: boolean
}
```

## Core Workflow
1. Load `project-fusion.json` config with Zod validation
2. Scan files by extensions, apply .gitignore + custom ignore patterns
3. Generate triple output:
   - `project-fusioned.txt` - Plain text with separators
   - `project-fusioned.md` - Markdown with syntax highlighting + TOC
   - `project-fusioned.html` - HTML with responsive design + interactive TOC

## Key Implementation Details
- **Branded types** (FilePath) prevent string confusion
- **Discriminated unions** (FusionResult) for type-safe error handling  
- **ESM modules** with strict TypeScript
- **Configuration fallbacks** - uses defaults if config missing/invalid

## Quick Reference
- **Add extensions**: Update `src/schema.ts` + `src/utils.ts` default config
- **Add commands**: Register in `src/cli.ts`, implement in `src/clicommands.ts`
- **Modify output**: Edit `src/fusion.ts` processing logic

## Documentation Style Guide
- **Keep it simple and professional**: Avoid superlatives and marketing language
- **Be factual**: Describe features without overselling
- **Use neutral tone**: Focus on functionality rather than promotional phrases
- **No excessive adjectives**: Avoid words like "powerful", "beautiful", "smart", etc.