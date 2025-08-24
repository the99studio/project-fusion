# Project Fusion - AI Context

> 📖 **For Human Developers**: See [DEVELOPMENT.md](./DEVELOPMENT.md)

## Quick Start
CLI tool merging project files into single .txt/.md/.html for AI collaboration.
- **Runtime**: Node 20.10+, TypeScript 5.9.2, ESM modules
- **Purpose**: Generate consolidated project snapshots for LLM context

## Architecture Overview
```
src/
├── adapters/file-system.ts     # FS abstraction layer
├── api.ts                      # Programmatic API + VS Code integration
├── benchmark.ts                # Performance metrics
├── cli.ts, clicommands.ts      # CLI entry points
├── fluent.ts                   # Fluent API builder pattern
├── fusion.ts                   # Core processing engine
├── plugins/plugin-system.ts    # Plugin architecture
├── schema.ts                   # Zod schemas + config validation
├── types.ts                    # TypeScript type definitions
├── strategies/output-*.ts      # Output format strategies
├── utils.ts                    # Utilities + security validation
└── utils/logger.ts             # Centralized logging system
```

## Critical Security Rules
1. **Path Traversal**: Always use `validateSecurePath()` from utils.ts
2. **Binary Detection**: Check null bytes before processing
3. **Content Validation**: Enforce limits (base64 >2KB, tokens >2000, lines >5000)
4. **Secret Redaction**: Auto-redact API keys, tokens, passwords in output
5. **Plugin Security**: External plugins require `allowExternalPlugins` flag
6. **Symlinks**: Disabled by default, check `allowSymlinks` config
7. **XSS Prevention**: Sanitize HTML output in output-strategy.ts

## Core Processing Flow
1. Config validation via Zod schemas
2. File discovery with gitignore respect
3. Security checks (path, symlink, binary)
4. Content validation and filtering
5. Plugin hooks execution
6. Output generation (text/markdown/HTML)
7. Optional clipboard copy

## Key Configuration Points
- **File Extensions**: `schema.ts:parsedFileExtensions` object
- **Ignore Patterns**: `utils.ts:defaultConfig.ignorePatterns`
- **Size Limits**: `maxFileSizeKB`, `maxTotalSizeMB`, `maxFiles`
- **Security Flags**: `allowSymlinks`, `allowExternalPlugins`, `excludeSecrets`

## Plugin System
- Hooks: `beforeFileProcessing`, `afterFileProcessing`, `beforeFusion`, `afterFusion`
- Registration: `registerFileExtensions`, `registerOutputStrategies`
- Lifecycle: `initialize`, `cleanup`
- All in `plugins/plugin-system.ts`

## Error Handling Pattern
- Use discriminated unions for `FusionResult`
- Throw `FusionError` with specific codes
- Add error placeholders for rejected content
- Log via centralized Logger, never expose paths

## Testing Requirements
- Coverage threshold: 80% (vitest.config.ts)
- Use MemoryFileSystemAdapter for isolation
- Property-based tests with fast-check
- Security test suite mandatory for changes

## Performance Considerations
- Stream large files when possible
- Early exit on binary detection
- Respect configurable limits
- Track metrics via benchmark.ts

## VS Code Integration
- API exports progress callbacks
- Cancellation token support
- Direct clipboard integration
- See api.ts for implementation

## Commands Reference
```bash
npm run build          # Compile + lint
npm run test           # Test suite with coverage
npm run typecheck      # Type checking only
npm run lint           # ESLint validation
```

## Quick Location Guide
- **CLI Commands**: clicommands.ts (init, config-check, etc.)
- **Config Validation**: schema.ts + utils.ts:validateConfig()
- **File Processing**: fusion.ts:processFiles()
- **Output Generation**: strategies/output-strategy.ts
- **Plugin Loading**: plugins/plugin-system.ts:loadPlugin()
- **Security Checks**: utils.ts:validateSecurePath(), isBinaryFile()
- **Progress Reporting**: api.ts (onProgress callback)
- **Logger Setup**: utils/logger.ts