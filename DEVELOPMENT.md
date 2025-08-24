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
- **Memory FS**: Isolated testing environment
- **Property tests**: fast-check for edge cases
- **Test files**: All `temp/` directory (gitignored)
- **Unit tests**: Vitest with coverage reporting

### VS Code Debug Configurations
Launch with F5:
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
```typescript
import type { Plugin, PluginHooks } from '@the99studio/project-fusion/plugins';

export const myPlugin: Plugin = {
    metadata: {
        name: 'my-plugin',
        version: '1.0.0',
        description: 'Custom plugin'
    },
    
    // Lifecycle hooks
    async initialize(config) {
        // Setup code
    },
    
    async beforeFileProcessing(fileInfo, config) {
        // Return null to skip file
        // Return modified fileInfo to process
        return fileInfo;
    },
    
    async afterFileProcessing(fileInfo, content, config) {
        // Transform content
        return modifiedContent;
    },
    
    async beforeFusion(config, files) {
        // Modify config or file list
        return { config, filesToProcess: files };
    },
    
    async afterFusion(result, config) {
        // Post-process result
        return result;
    },
    
    // Registration methods
    registerFileExtensions() {
        return { 
            custom: ['.xyz', '.abc']
        };
    },
    
    registerOutputStrategies() {
        return [{
            name: 'json',
            extension: '.json',
            generateHeader: (ctx) => '{\n',
            processFile: (file, ctx) => JSON.stringify(file),
            generateFooter: (ctx) => '\n}'
        }];
    },
    
    async cleanup() {
        // Cleanup code
    }
};
```

### Loading Plugins
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
```javascript
import { fusionAPI } from '@the99studio/project-fusion/api';

const result = await fusionAPI({
    rootDirectory: './src',
    extensionGroups: ['web', 'backend'],
    outputDirectory: './output',
    
    // Progress callback
    onProgress: (progress) => {
        console.log(`${progress.step}: ${progress.percentage}%`);
        console.log(progress.message);
    },
    
    // Cancellation support
    cancellationToken: {
        isCancellationRequested: false,
        onCancellationRequested: (cb) => {
            process.on('SIGINT', cb);
        }
    },
    
    // Completion callback
    onDidFinish: (result) => {
        if (result.success) {
            console.log('Files:', result.filesProcessed);
        }
    }
});
```

### Custom File System Adapter
```javascript
import { MemoryFileSystemAdapter } from '@the99studio/project-fusion/adapters';

const memFs = new MemoryFileSystemAdapter();
memFs.addFile('/src/app.js', 'console.log("Hello");');

await fusionAPI({
    fs: memFs,
    rootDirectory: '/src'
});
```

### Fluent API Builder
```javascript
import { projectFusion } from '@the99studio/project-fusion/fluent';

await projectFusion()
    .root('./src')
    .include(['web', 'backend'])
    .exclude(['*.test.js', '*.spec.ts'])
    .maxSize('5MB')
    .maxFiles(500)
    .output(['md', 'html'])
    .plugin('minify-plugin')
    .clipboard()
    .generate();
```

## Project Structure

```
project-fusion/
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
│   ├── plugins/
│   │   └── plugin-system.ts    # Plugin manager
│   ├── schema.ts           # Zod schemas
│   ├── strategies/
│   │   └── output-strategy.ts  # Output formats
│   ├── types.ts            # TypeScript types
│   └── utils.ts            # Utilities
├── temp/                   # Test temp files (gitignored)
└── tests/                  # Test suites
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## Debugging Tips

1. **Check logs**: Generated `.log` file in output directory
2. **Config validation**: Run `project-fusion config-check`
3. **Enable verbose logging**: Set `DEBUG=project-fusion:*` environment variable
4. **Memory issues**: Adjust `maxTotalSizeMB` and `maxFiles` limits
5. **Preview mode**: Use `--preview` to see what files would be processed

## Performance Optimization

- Binary files automatically detected and skipped
- Configurable limits prevent memory exhaustion
- Content validation prevents processing malformed files
- Files are processed in streaming mode for large projects
- Progress reporting for long-running operations

## Security Considerations

- Content validation for suspicious patterns
- External plugins require explicit flag
- Path traversal protection enforced
- Secret redaction in output files
- Symlinks disabled by default
- XSS prevention in HTML output