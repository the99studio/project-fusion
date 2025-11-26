# Project Fusion - AI Context

> 📖 **For Human Developers**: See [DEVELOPMENT.md](./DEVELOPMENT.md)

## Quick Start
CLI tool merging project files into single .txt/.md/.html for AI collaboration.
- **Runtime**: Node 20.10+, TypeScript 5.9.3, ESM modules
- **Version**: 1.1.4
- **Purpose**: Generate consolidated project snapshots for LLM context

## Project Structure
```
project-fusion/
├── .github/workflows/      # CI/CD pipelines
│   ├── build-test.yml      # PR testing (Node 20.x, 22.x)
│   ├── ci.yml              # Main CI pipeline
│   └── release.yml         # NPM auto-publish on tags
├── .vscode/                # IDE configurations
│   ├── launch.json         # Debug configurations
│   └── settings.json       # Project settings
├── dist/                   # Compiled JavaScript output
├── src/                    # TypeScript source code
│   ├── adapters/
│   │   └── file-system.ts  # FS abstraction layer
│   ├── api.ts              # Programmatic API + VS Code
│   ├── benchmark.ts        # Performance metrics
│   ├── cli.ts              # CLI entry point
│   ├── clicommands.ts      # CLI command handlers
│   ├── fluent.ts           # Fluent API builder
│   ├── fusion.ts           # Core processing engine
│   ├── index.ts            # Main exports
│   ├── plugins/
│   │   └── plugin-system.ts    # Plugin architecture
│   ├── schema.ts           # Zod schemas + config
│   ├── strategies/
│   │   └── output-strategy.ts  # Output formats (txt/md/html)
│   ├── types.ts            # TypeScript type definitions
│   ├── utils.ts            # Security + validation utilities
│   └── utils/
│       └── logger.ts       # Centralized logging
├── tests/                  # Test suites (49 files)
│   ├── __snapshots__/      # Vitest snapshots
│   └── *.test.ts           # Unit/integration tests
├── temp/                   # Temporary test files (gitignored)
├── eslint.config.js        # ESLint configuration
├── package.json            # Dependencies + scripts
├── project-fusion.json     # Default config template
├── tsconfig.json           # TypeScript config (ES2022, ESM)
└── vitest.config.ts        # Test runner config (80% coverage)
```

## Critical Security Rules
1. **Path Traversal**: Always use `validateSecurePath()` from utils.ts
2. **Binary Detection**: Check null bytes before processing
3. **Content Validation**: Enforce limits (base64 >2KB, tokens >2000, lines >5000)
4. **Secret Redaction**: Auto-redact API keys, tokens, passwords in output
5. **Plugin Security**: External plugins require `allowedExternalPluginPaths` config
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

## Key Configuration Schema
Config object structure in `schema.ts`:
- **File Extensions**: `parsedFileExtensions` (backend, config, cpp, doc, godot, scripts, web)
- **Ignore Patterns**: `ignorePatterns` array + `useGitIgnoreForExcludes`
- **Output**: `generateText`, `generateMarkdown`, `generateHtml`, `copyToClipboard`
- **Processing**: `parseSubDirectories`, `rootDirectory`, `outputDirectory`
- **Security Flags**: `allowSymlinks` (false), `allowedExternalPluginPaths` ([]), `excludeSecrets` (true)
- **Size Limits**: `maxFileSizeKB` (5000), `maxTotalSizeMB` (50), `maxFiles` (1000)

## Plugin System
- All in `plugins/plugin-system.ts`
- Hooks: `beforeFileProcessing`, `afterFileProcessing`, `beforeFusion`, `afterFusion`
- Lifecycle: `initialize`, `cleanup`
- Registration: `registerFileExtensions`, `registerOutputStrategies`

## Error Handling Pattern
- Add error placeholders for rejected content
- Log via centralized Logger, never expose paths
- Throw `FusionError` with specific codes
- Use discriminated unions for `FusionResult`

## Testing Requirements
- Coverage threshold: 80% (vitest.config.ts)
- Property-based tests with fast-check
- Security test suite mandatory for changes
- Use MemoryFileSystemAdapter for isolation

## Performance Considerations
- Early exit on binary detection
- Respect configurable limits
- Stream large files when possible
- Track metrics via benchmark.ts

## VS Code Integration
- API exports progress callbacks
- Cancellation token support
- Direct clipboard integration
- See api.ts for implementation

## Commands Reference
```bash
# Development (package.json scripts)
npm run build          # tsc + lint
npm run test           # build:clean + vitest --coverage
npm run lint           # eslint src/**/*.ts
npm run clean          # rm -rf dist

# CLI Usage
project-fusion         # Run with project-fusion.json config
project-fusion init    # Create config file
project-fusion config-check  # Validate config
project-fusion --extensions web  # Process only web files
project-fusion --help  # Show all CLI options
```

## Quick Location Guide
- **CLI Commands**: clicommands.ts (init, config-check, etc.)
- **Config Validation**: schema.ts + utils.ts:validateConfig()
- **File Processing**: fusion.ts:processFiles()
- **Logger Setup**: utils/logger.ts
- **Output Generation**: strategies/output-strategy.ts
- **Plugin Loading**: plugins/plugin-system.ts:loadPlugin()
- **Progress Reporting**: api.ts (onProgress callback)
- **Security Checks**: utils.ts:validateSecurePath(), isBinaryFile()

## File Extension Groups
Located in `schema.ts:parsedFileExtensions`:
- **backend**: .cs, .go, .java, .php, .py, .rb, .rs
- **config**: .json, .snap, .toml, .xml, .yaml, .yml
- **cpp**: .c, .cc, .cpp, .h, .hpp
- **doc**: .adoc, .md, .rst
- **godot**: .cfg, .cs, .gd, .import, .tres, .tscn
- **scripts**: .bash, .bat, .bats, .cmd, .ps1, .sh
- **web**: .css, .html, .js, .jsx, .svelte, .ts, .tsx, .vue

## Package.json Key Info
- **Bin**: project-fusion -> dist/cli.js
- **Dependencies**: chalk, clipboardy, commander, fs-extra, glob, ignore, minimatch, zod
- **Engine**: Node >=20.10.0
- **Exports**: main, /api, /fluent, /plugins
- **Name**: @the99studio/project-fusion
- **Type**: "module" (ESM only)
- **Version**: 1.1.4 (semantic versioning)

## Default Ignore Patterns (project-fusion.json)
node_modules/, dist/, build/, .git/, .idea/, .DS_Store, package-lock.json, *.exe, *.dll, *.so, *.dylib, *.zip, *.tar, *.gz, *.rar, images, videos, audio files

## Include Filenames (project-fusion.json)
Files without extensions included by default: .gitignore, CODEOWNERS, Dockerfile, Dockerfile.*, Gemfile, Jenkinsfile, LICENSE, Makefile, Rakefile, Vagrantfile