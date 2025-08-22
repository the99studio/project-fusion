# Project Fusion - AI Context

> 📖 **Human Dev**: See [DEVELOPMENT.md](./DEVELOPMENT.md)

## Overview
CLI merging project files into .txt/.md/.html for AI collaboration. Node 20.10+, TS 5.9.2 ESM.

## Architecture
```
src/
├── adapters/file-system.ts     # FS abstraction
├── api.ts                      # Programmatic API + VS Code support
├── benchmark.ts                # Performance tracking
├── cli.ts, clicommands.ts      # CLI interface
├── fluent.ts                   # Fluent API builder
├── fusion.ts                   # Core processing logic
├── plugins/plugin-system.ts    # Plugin architecture
├── schema.ts, types.ts         # Type definitions
├── strategies/output-*.ts      # Output formats
└── utils.ts                    # Utilities + validation
```

## Key APIs
```typescript
// Programmatic (with progress/cancellation)
fusionAPI({ rootDirectory: '.', onProgress: (p) => {} })

// Fluent
projectFusion().include(['web']).maxSize('2MB').generate()

// Plugin hooks
beforeFileProcessing, afterFusion, registerOutputStrategies
```

## Config Schema
```typescript
{
  // Core
  rootDirectory: string
  generatedFileName: string  
  schemaVersion: 1
  
  // Output
  generate{Text,Markdown,Html}: boolean
  copyToClipboard: boolean
  outputDirectory?: string
  
  // Limits
  max{FileSizeKB,Files,TotalSizeMB}: number
  max{Base64BlockKB,TokenLength,LineLength}: number
  
  // Security
  allowSymlinks: boolean
  allowExternalPlugins: boolean
  excludeSecrets: boolean
  
  // Filtering
  parseSubDirectories: boolean
  useGitIgnoreForExcludes: boolean
  ignorePatterns: string[]
  parsedFileExtensions: {
    backend: ['.cs','.go','.java','.php','.py','.rb','.rs']
    config: ['.json','.toml','.xml','.yaml']
    cpp: ['.c','.cpp','.h','.hpp']
    doc: ['.adoc','.md','.rst']
    godot: ['.cfg','.gd','.import','.tres','.tscn']
    scripts: ['.bat','.cmd','.ps1','.sh']
    web: ['.js','.jsx','.svelte','.ts','.tsx','.vue']
  }
}
```

## Security Features
- Binary file auto-skip via null byte detection
- Content validation (base64 >2KB, tokens >2000, lines >5000)
- Path traversal protection via `validateSecurePath()`
- Plugin path validation
- Secret redaction (API keys, tokens, passwords)
- Symlink detection/blocking (configurable)
- XSS prevention in HTML output

## Testing Strategy
- Memory FS for isolated tests
- Performance benchmarks
- Property-based testing (fast-check)
- Security test coverage
- Vitest + 20 test suites

## Commands
```bash
npm run build          # TS→JS + lint
npm run test           # Full test suite
npm run typecheck      # Type validation
project-fusion         # Run fusion
project-fusion init    # Create config
```

## Quick Edits
- CLI options: `clicommands.ts`
- Extensions: `schema.ts:parsedFileExtensions`
- Ignore patterns: `utils.ts:defaultConfig.ignorePatterns`
- Output formats: `strategies/output-strategy.ts`
- Plugin hooks: `plugins/plugin-system.ts`

## Error Handling
- Discriminated unions (`FusionResult`)
- Error placeholders for rejected content
- `FusionError` with codes/severity
- Safe logging without path exposure