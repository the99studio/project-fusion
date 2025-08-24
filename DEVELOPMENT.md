# Development Guide

> 📋 **For Claude Code Context**: See [CLAUDE.md](./CLAUDE.md) | 📖 **For Users**: See [README.md](./README.md)

## Project Setup

Requires [Node.js 20.10.0+](https://nodejs.org/en/download)

```bash
git clone https://github.com/the99studio/project-fusion.git
cd project-fusion
npm install
npm run build
```

## VS Code Debug
[Launch configurations](./.vscode/launch.json) available (F5):

- **Config Check** - Validate configuration file
- **Fusion** - Standard fusion with current directory
- **Generate NPM Package Temp** - Build, pack and test the npm package locally
- **Help** - Show help information
- **Init (Force)** - Overwrite existing config file
- **Init** - Create new config file
- **Tests** - Run the full test suite

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

## Configuration

- **[eslint.config.js](./eslint.config.js)**: Linting rules
- **[package.json](./package.json)**: Package metadata and scripts
- **[project-fusion.json](./project-fusion.json)**: Default project config
- **[tsconfig.json](./tsconfig.json)**: TypeScript configuration (ES2022, ESM)
- **[vitest.config.ts](./vitest.config.ts)**: Test configuration

## Testing

```bash
npm run test # Run full test suite with coverage
```

- **Coverage**: V8 provider, reports in `./coverage/` (80% threshold)
- **Framework**: [Vitest](./vitest.config.ts)
- **Memory FS**: Isolated testing environment using [MemoryFileSystemAdapter](./src/adapters/file-system.ts)
- **Property tests**: fast-check for edge cases
- **Temp files**: Use `temp/` directory (gitignored)
- **Test files**: All in [`tests/`](./tests/) directory

## Performance

- Benchmark tracking via [`benchmark.ts`](./src/benchmark.ts)
- Binary files automatically detected via null byte check ([`utils.ts`](./src/utils.ts))
- Configurable limits prevent memory exhaustion ([`schema.ts`](./src/schema.ts))
- Content validation prevents processing malformed files
- Parallel test execution with Vitest forks
- Progress reporting for long-running operations

## Security

- Comprehensive security test suite ([`tests/security*.test.ts`](./tests/))
- Content validation for suspicious patterns ([`utils.ts`](./src/utils.ts))
- External plugins require `allowExternalPlugins` flag
- Path traversal protection via `validateSecurePath()` ([`utils.ts`](./src/utils.ts))
- Secret redaction in output files (API keys, tokens, passwords)
- Symlinks disabled by default (configurable via `allowSymlinks`)
- XSS prevention in HTML output ([`output-strategy.ts`](./src/strategies/output-strategy.ts))

## CI/CD

- **[build-test.yml](./.github/workflows/build-test.yml)**: Runs on PRs, tests Node 20.x and 22.x
- **[ci.yml](./.github/workflows/ci.yml)**: Main CI pipeline
- **[release.yml](./.github/workflows/release.yml)**: Automated NPM publishing on version tags

## Local Package Testing

Test your changes locally before publishing:

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

Publishing is automated via GitHub Actions when you push a version tag:

```bash
# 1. Ensure you're on main branch with latest changes
git checkout main
git pull origin main

# 2. Bump version (creates commit + tag automatically)
npm version patch  # 1.0.0 → 1.0.1 (bug fixes)
# or: npm version minor  # 1.0.0 → 1.1.0 (new features)
# or: npm version major  # 1.0.0 → 2.0.0 (breaking changes)

# 3. Push everything (commits + tag)
git push && git push --tags
```

The [release.yml](./.github/workflows/release.yml) workflow automatically:
- Runs all tests
- Builds the project
- Publishes to npm
- Creates a GitHub release

**Prerequisites**: NPM_TOKEN must be configured in repository secrets.

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

## API Usage

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