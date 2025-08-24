# Development Guide

> 📋 **For Claude Code Context**: See [CLAUDE.md](./CLAUDE.md) | 📖 **For Users**: See [README.md](./README.md)

## Project Setup

```bash
git clone https://github.com/the99studio/project-fusion.git
cd project-fusion
npm install
npm run build
npm run test
```

### Requirements
- Node.js 20.10.0+
- TypeScript 5.9.2+
- ESM modules

## Development Workflow

### Commands
```bash
npm run build          # Compile TypeScript + lint
npm run clean          # Remove dist directory
npm run lint           # ESLint checks
npm run test           # Run full test suite with coverage
npm run typecheck      # Type validation only
```

### Testing
- **Framework**: [Vitest](./vitest.config.ts) with coverage reporting (80% threshold)
- **Memory FS**: Isolated testing environment using [MemoryFileSystemAdapter](./src/adapters/file-system.ts)
- **Property tests**: fast-check for edge cases
- **Test files**: All in [`tests/`](./tests/) directory
- **Temp files**: Use `temp/` directory (gitignored)
- **Coverage**: V8 provider, reports in `./coverage/`

### VS Code Debug Configurations
[Launch configurations](./.vscode/launch.json) available (F5):
- **Fusion (Default)** - Standard fusion
- **Fusion (Preview)** - Preview mode
- **Fusion (Web)** - Web files only
- **Help** - Show help
- **Init** - Create config

## Local Package Testing

```bash
# Build and pack
npm run build
npm pack

# Install globally
npm install -g ./the99studio-project-fusion-*.tgz

# Test
project-fusion --help
cd /some/project
project-fusion

# Uninstall
npm uninstall -g @the99studio/project-fusion
```

## Publishing

```bash
# Ensure tests pass
npm test

# Login to npm
npm login

# Publish (runs prepublishOnly hook)
npm publish
```

## Plugin Development

### Plugin Interface
See [`src/plugins/plugin-system.ts`](./src/plugins/plugin-system.ts) for the complete Plugin interface.

Key plugin hooks:
- `initialize` - Setup code
- `beforeFileProcessing` - Filter/modify files before processing
- `afterFileProcessing` - Transform file content
- `beforeFusion` - Modify config or file list
- `afterFusion` - Post-process result
- `registerFileExtensions` - Add custom extensions
- `registerOutputStrategies` - Add output formats
- `cleanup` - Cleanup resources

### Loading Plugins
Plugins can be loaded via the [API](./src/api.ts):
```javascript
import { fusionAPI } from '@the99studio/project-fusion/api';

await fusionAPI({
    pluginsDir: './plugins',
    enabledPlugins: ['my-plugin'],
    allowExternalPlugins: true  // Required for external plugins
});
```

## Advanced API Usage

### Programmatic API with Progress
The [fusionAPI](./src/api.ts) supports progress tracking and cancellation:
```javascript
import { fusionAPI } from '@the99studio/project-fusion/api';

const result = await fusionAPI({
    rootDirectory: './src',
    extensionGroups: ['web', 'backend'],
    onProgress: (progress) => console.log(`${progress.percentage}%`),
    cancellationToken: { /* ... */ }
});
```

### Custom File System Adapter
Use [MemoryFileSystemAdapter](./src/adapters/file-system.ts) for testing:
```javascript
import { MemoryFileSystemAdapter } from '@the99studio/project-fusion/adapters';

const memFs = new MemoryFileSystemAdapter();
memFs.addFile('/src/app.js', 'console.log("Hello");');
await fusionAPI({ fs: memFs, rootDirectory: '/src' });
```

### Fluent API Builder
The [Fluent API](./src/fluent.ts) provides a chainable interface:
```javascript
import { projectFusion } from '@the99studio/project-fusion/fluent';

await projectFusion()
    .root('./src')
    .include(['web', 'backend'])
    .maxSize('5MB')
    .output(['md', 'html'])
    .generate();
```

## Project Structure

```
project-fusion/
├── .github/workflows/      # CI/CD pipelines
│   ├── build-test.yml      # Build and test workflow
│   ├── ci.yml              # Continuous integration
│   └── release.yml         # NPM release automation
├── dist/                   # Compiled output
├── src/
│   ├── adapters/
│   │   └── file-system.ts  # FS abstraction
│   ├── api.ts              # Programmatic API
│   ├── benchmark.ts        # Performance tracking
│   ├── cli.ts              # CLI entry point
│   ├── clicommands.ts      # CLI commands
│   ├── fluent.ts           # Fluent API builder
│   ├── fusion.ts           # Core processing
│   ├── index.ts            # Main export
│   ├── plugins/
│   │   └── plugin-system.ts    # Plugin manager
│   ├── schema.ts           # Zod schemas & config
│   ├── strategies/
│   │   └── output-strategy.ts  # Output formats
│   ├── types.ts            # TypeScript types
│   ├── utils.ts            # Utilities & validation
│   └── utils/
│       └── logger.ts       # Centralized logging
├── tests/                  # Test suites (30+ test files)
│   └── __snapshots__/      # Vitest snapshots
└── temp/                   # Test temp files (gitignored)
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## CI/CD

### GitHub Actions Workflows
- **[build-test.yml](./.github/workflows/build-test.yml)**: Runs on PRs, tests Node 20.x and 22.x
- **[ci.yml](./.github/workflows/ci.yml)**: Main CI pipeline
- **[release.yml](./.github/workflows/release.yml)**: Automated NPM publishing on version tags

## Configuration

### Main Config Files
- **[project-fusion.json](./project-fusion.json)**: Default project config
- **[tsconfig.json](./tsconfig.json)**: TypeScript configuration (ES2022, ESM)
- **[vitest.config.ts](./vitest.config.ts)**: Test configuration
- **[eslint.config.js](./eslint.config.js)**: Linting rules
- **[package.json](./package.json)**: Package metadata and scripts

## Debugging Tips

1. **Check logs**: Generated `.log` file in output directory
2. **Config validation**: Run `project-fusion config-check` (see [`src/clicommands.ts`](./src/clicommands.ts#L268))
3. **Logger**: Use centralized [`Logger`](./src/utils/logger.ts) for structured logging
4. **Memory issues**: Adjust `maxTotalSizeMB` and `maxFiles` limits
5. **Preview mode**: Use `--preview` to see what files would be processed
6. **VS Code**: Use [debug configurations](./.vscode/launch.json) for debugging

## Performance Optimization

- Binary files automatically detected via null byte check ([`utils.ts`](./src/utils.ts))
- Configurable limits prevent memory exhaustion ([`schema.ts`](./src/schema.ts))
- Content validation prevents processing malformed files
- Benchmark tracking via [`benchmark.ts`](./src/benchmark.ts)
- Progress reporting for long-running operations
- Parallel test execution with Vitest forks

## Security Considerations

- Content validation for suspicious patterns ([`utils.ts`](./src/utils.ts))
- External plugins require `allowExternalPlugins` flag
- Path traversal protection via `validateSecurePath()` ([`utils.ts`](./src/utils.ts))
- Secret redaction in output files (API keys, tokens, passwords)
- Symlinks disabled by default (configurable via `allowSymlinks`)
- XSS prevention in HTML output ([`output-strategy.ts`](./src/strategies/output-strategy.ts))
- Comprehensive security test suite ([`tests/security*.test.ts`](./tests/))