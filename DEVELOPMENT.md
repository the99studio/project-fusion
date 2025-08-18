# Project Fusion - Development Guide

> 📋 **For Claude AI Context**: See [CLAUDE.md](./CLAUDE.md) for essential project information needed for development assistance.
> 📖 **For Users**: Looking for basic usage? Check the [README.md](./README.md) for quick start instructions.

## Development Workflow

### Initial Setup
```bash
git clone https://github.com/the99studio/project-fusion.git
cd project-fusion
npm install
npm run build
```

### Claude Code Integration
The project includes `.claude/settings.local.json` which configures Claude Code permissions for smoother development. This file provides:

**Allowed Operations:**
- NPM commands: install, build, typecheck, test, clean, pack
- Project CLI: `project-fusion` and `node dist/cli.js` commands
- Git operations: status, diff, log, branch, add, commit, push, pull
- Safe file operations: Limited to `temp/` directory for rm/cp operations
- Search capabilities: find, grep, rg, ls, cat, head, tail for code exploration
- Package management: npm list, outdated, view

**Security Features:**
- File deletions restricted to `temp/` directory only
- No arbitrary Node.js code execution (only specific CLI commands)
- Explicit deny list for dangerous operations (sudo, eval, etc.)
- No system-wide file modifications allowed

These permissions eliminate repetitive authorization prompts while maintaining security boundaries.

### Testing the CLI
Use VS Code launch configurations (F5) for easy testing:
- **"Fusion (Default)"** - Default behavior (runs fusion)
- **"Fusion (Web)"** - Test web extensions only
- **"Help"** - Test CLI help
- **"Init"** - Test project initialization

### Testing with Real Package
For testing as if it were the real published package, see the [NPM Package Testing](#-npm-package-management) section below.

## NPM Package Management

### Pre-Publication Testing

Use the **"Test NPM Package"** launch configuration in VS Code (F5) which automatically:
- Builds the project
- Creates and extracts test package to `temp/package/`
- Installs dependencies and tests CLI functionality

#### Manual Package Verification
```bash
# Preview what will be published
npm pack --dry-run

# Create test package (if not using VS Code)
npm pack  # Creates project-fusion-x.x.x.tgz
```

#### Testing with Real Package Installation
```bash
# Install the test package globally
npm install -g ./temp/package/ # start line with sudo if you need admin rights

# Test commands (acts like real published package)
project-fusion --help
project-fusion --version
project-fusion init
project-fusion # Default: runs fusion

# Uninstall when done testing
npm uninstall -g project-fusion # start line with sudo if you need admin rights
```

### Publication Process

```bash
# 1. Final verification
npm pack --dry-run

# 2. Simulate publication (verifies authentication, package validity)
npm publish --dry-run

# 3. Create npm account and login (first time only)
# Visit https://www.npmjs.com/signup to create account
npm login

# 4. Publish to npm
npm publish

# 5. Verify publication
npm view project-fusion
```

## 🛠️ Development Patterns

### Adding New File Extensions
1. Update `src/schema.ts` - add to `ParsedFileExtensionsSchema`
2. Update default config in `src/utils.ts` 
3. Test with various projects

### Adding New CLI Commands
1. Register command in `src/cli.ts` (Commander.js)
2. Implement in `src/clicommands.ts`
3. Update help text and documentation

### Modifying Fusion Output
1. Edit `src/fusion.ts` processing logic
2. Update types in `src/types.ts` if needed
3. Test both .txt and .md output formats

## 🔌 Plugin Development

### Creating a Plugin

Plugins extend Project Fusion's functionality through hooks and custom processing. Here's how to create one:

#### Basic Plugin Structure
```javascript
// my-plugin.js
export const plugin = {
    metadata: {
        name: 'my-plugin',
        version: '1.0.0',
        description: 'Description of what your plugin does',
        author: 'Your Name',
        homepage: 'https://github.com/yourusername/my-plugin'
    },
    
    // Optional: Initialize resources
    async initialize(config) {
        console.log(`Initializing ${this.metadata.name}...`);
    },
    
    // Optional: Process files before fusion
    async beforeFileProcessing(fileInfo, config) {
        // Return null to skip file, or modified fileInfo
        return fileInfo;
    },
    
    // Optional: Transform file content after processing
    async afterFileProcessing(fileInfo, content, config) {
        // Return transformed content
        return content;
    },
    
    // Optional: Modify config or files list before fusion
    async beforeFusion(config, filesToProcess) {
        return { config, filesToProcess };
    },
    
    // Optional: Post-process fusion result
    async afterFusion(result, config) {
        return result;
    },
    
    // Optional: Add custom file extensions
    registerFileExtensions() {
        return {
            custom: ['.xyz', '.abc']
        };
    },
    
    // Optional: Add output formats (JSON, XML, etc.)
    registerOutputStrategies() {
        return [{
            name: 'json',
            extension: '.json',
            async generate(files, config) {
                return JSON.stringify(files, null, 2);
            }
        }];
    },
    
    // Optional: Cleanup resources
    async cleanup() {
        console.log('Cleaning up...');
    }
};

export default plugin;
```

### Available Hooks

| Hook | Purpose | Parameters | Return |
|------|---------|------------|--------|
| `initialize` | Setup plugin resources | `config` | `void` |
| `beforeFileProcessing` | Filter/modify files before processing | `fileInfo, config` | `fileInfo` or `null` to skip |
| `afterFileProcessing` | Transform file content | `fileInfo, content, config` | Modified `content` |
| `beforeFusion` | Modify config or files list | `config, filesToProcess` | `{config, filesToProcess}` |
| `afterFusion` | Post-process results | `result, config` | Modified `result` |
| `registerFileExtensions` | Add file extensions | none | `{group: [extensions]}` |
| `registerOutputStrategies` | Add output formats | none | Array of strategies |
| `cleanup` | Release resources | none | `void` |

### Using Plugins

#### Via CLI
```bash
# Load plugins from a directory
project-fusion --plugins-dir ./plugins

# Enable specific plugins by name
project-fusion --plugins minifier,formatter

# Combine both options
project-fusion --plugins-dir ./plugins --plugins minifier
```

#### Via Programmatic API
```javascript
import { processFusion } from 'project-fusion';

const result = await processFusion(config, {
    pluginsDir: './plugins',
    enabledPlugins: ['minifier', 'formatter']
});
```

### Plugin Examples

#### Example: Code Minifier
See `temp/example-plugin.js` for a complete example that:
- Minifies JavaScript and CSS files
- Adds custom metadata to files
- Sorts files by extension
- Provides JSON output format

#### Example: Security Scanner
```javascript
export default {
    metadata: {
        name: 'security-scanner',
        version: '1.0.0',
        description: 'Scans for security issues'
    },
    
    async afterFileProcessing(fileInfo, content, config) {
        // Check for hardcoded secrets
        const patterns = [
            /api[_-]?key\s*=\s*['"][^'"]+['"]/gi,
            /password\s*=\s*['"][^'"]+['"]/gi
        ];
        
        for (const pattern of patterns) {
            if (pattern.test(content)) {
                console.warn(`⚠️ Potential secret in ${fileInfo.path}`);
                // Optionally redact the secret
                content = content.replace(pattern, '***REDACTED***');
            }
        }
        
        return content;
    }
};
```

### Plugin Development Tips

1. **Keep plugins focused** - One plugin should do one thing well
2. **Handle errors gracefully** - Don't crash the fusion process
3. **Use metadata** - Provide clear name, version, and description
4. **Test thoroughly** - Test with various file types and edge cases
5. **Document usage** - Include examples and configuration options

### Plugin Distribution

- **NPM Package**: Publish as `project-fusion-plugin-*`
- **GitHub**: Share plugin files directly
- **Local**: Place in project's `plugins/` directory

## Testing Strategy

### Manual Testing Checklist
- [ ] `npm run build` - clean build
- [ ] `npm run typecheck` - no type errors
- [ ] CLI help works: `project-fusion --help`
- [ ] Init works: `project-fusion init`
- [ ] Fusion works: `project-fusion`
- [ ] Extension filtering works
- [ ] .gitignore integration works
- [ ] Output files are properly formatted
- [ ] Package builds and installs correctly

### Test Projects
Use these types of projects for testing:
- **Node.js/TypeScript** (like this project)
- **Python projects** (test backend extensions)
- **React/Vue projects** (test web extensions)
- **Mixed projects** (multiple extension types)

## Troubleshooting

### Common Issues

**Build Errors:**
```bash
npm run clean && npm run build
```

**Package Contains Wrong Files:**
- Check `package.json` `files` field
- Use `npm pack --dry-run` to verify

**TypeScript Errors:**
```bash
npm run typecheck
# Fix errors in src/ files
```

## Directory Structure

```
project-fusion/
├── src/                    # TypeScript source
│   ├── cli.ts             # CLI entry point
│   ├── clicommands.ts     # Command implementations
│   ├── fusion.ts          # Core fusion logic
│   ├── types.ts           # Type definitions
│   ├── schema.ts          # Zod schemas
│   ├── utils.ts           # Utilities
│   └── index.ts           # Main exports
├── dist/                  # Compiled JavaScript (gitignored)
├── temp/                  # Testing directory (gitignored)
├── CLAUDE.md              # AI context (essential info)
├── DEVELOPMENT.md         # This file (human development)
├── package.json           # NPM configuration
└── tsconfig.json          # TypeScript configuration
```

## Important Files

- **CLAUDE.md** - Essential project context for AI assistance
- **package.json** - NPM package configuration and scripts
- **tsconfig.json** - TypeScript compilation settings
- **.gitignore** - Git ignore patterns (includes `temp/`)
- **.vscode/launch.json** - VS Code debugging/testing configurations

## Advanced API Usage

### VS Code Extension Integration

```typescript
import * as vscode from 'vscode';
import { fusionAPI } from 'project-fusion';

export async function activate(context: vscode.ExtensionContext) {
    const disposable = vscode.commands.registerCommand('extension.fusionProject', async () => {
        const workspacePath = vscode.workspace.rootPath;
        
        if (!workspacePath) {
            vscode.window.showErrorMessage('No workspace folder open');
            return;
        }
        
        try {
            const result = await fusionAPI({
                rootDirectory: workspacePath,
                generateHtml: true,
                generateMarkdown: true,
                copyToClipboard: false
            });
            
            if (result.success) {
                vscode.window.showInformationMessage(`Fusion completed: ${result.filesProcessed} files`);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Fusion failed: ${error.message}`);
        }
    });
    
    context.subscriptions.push(disposable);
}
```

### CI/CD Pipeline Integration

```typescript
import { runFusion } from 'project-fusion';

async function generateReleaseArtifacts() {
    const config = {
        rootDirectory: process.env.GITHUB_WORKSPACE || process.cwd(),
        generatedFileName: `release-${process.env.GITHUB_SHA?.slice(0, 7)}`,
        copyToClipboard: false,
        maxFileSizeKB: 2048,
        ignorePatterns: ['.git/', 'node_modules/', '*.log']
    };
    
    const result = await runFusion(config, {
        extensionGroups: ['web', 'backend', 'config', 'doc']
    });
    
    if (result.success) {
        console.log(`Generated release artifacts at ${result.fusionFilePath}`);
    }
    
    return result;
}
```

### Monorepo Support

```typescript
import { fusionAPI } from 'project-fusion';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';

async function processMonorepo(monorepoPath: string) {
    const packages = readdirSync(join(monorepoPath, 'packages'))
        .filter(dir => statSync(join(monorepoPath, 'packages', dir)).isDirectory());
    
    const results = await Promise.all(
        packages.map(async (packageName) => {
            const packagePath = join(monorepoPath, 'packages', packageName);
            
            return await fusionAPI({
                rootDirectory: packagePath,
                generatedFileName: `${packageName}-fusion`,
                generateHtml: false,
                parsedFileExtensions: {
                    web: ['.ts', '.tsx'],
                    backend: ['.js'],
                    config: ['.json', '.yaml']
                }
            });
        })
    );
    
    const successful = results.filter(r => r.success);
    console.log(`Processed ${successful.length}/${packages.length} packages`);
    
    return results;
}
```

## Complete Programmatic API Reference

Project Fusion provides multiple APIs for different use cases and preferences.

### Fluent API (Recommended)

The fluent API provides a chainable interface for better developer experience:

```javascript
import { projectFusion } from 'project-fusion/fluent';

// Basic usage
const result = await projectFusion()
  .include(['web'])
  .generate();

// Advanced configuration
const result = await projectFusion()
  .root('./src')
  .include(['web', 'backend'])
  .exclude(['*.test.js', 'node_modules/'])
  .maxSize('2MB')
  .output(['md', 'html'])
  .name('my-project-fusion')
  .clipboard(false)
  .generate();

// With custom extensions
const result = await projectFusion()
  .extensions('mobile', ['.swift', '.kt', '.dart'])
  .include(['mobile'])
  .generate();
```

### Standard API

The standard API accepts configuration objects:

```javascript
import { fusionAPI } from 'project-fusion/api';

// Simple usage
const result = await fusionAPI({
  rootDirectory: './src',
  extensionGroups: ['web'],
  generateHtml: false
});

// Advanced usage with custom config
const result = await fusionAPI({
  rootDirectory: '/path/to/project',
  generateText: true,
  generateMarkdown: true,
  generateHtml: false,
  maxFileSizeKB: 2048,
  ignorePatterns: ['tests/', '*.spec.ts'],
  parsedFileExtensions: {
    web: ['.ts', '.tsx', '.js'],
    backend: ['.py', '.go'],
    custom: ['.xyz', '.abc']
  }
});
```

### Low-Level API

For maximum control, use the core fusion functions:

```javascript
import { createConfig, runFusion } from 'project-fusion/api';

// Create configuration
const config = createConfig({
  generateHtml: false,
  maxFileSizeKB: 2048
});

// Run fusion with options
const result = await runFusion(config, {
  extensionGroups: ['web', 'backend'],
  pluginsDir: './plugins',
  enabledPlugins: ['minifier']
});
```

### API Return Types

All APIs return a `ProgrammaticFusionResult`:

```typescript
interface ProgrammaticFusionResult {
  success: boolean;
  message: string;
  fusionFilePath?: string;    // Path to generated fusion file
  logFilePath?: string;       // Path to log file
  filesProcessed?: number;    // Number of files processed
  error?: Error | string;     // Error details if failed
}
```

### Configuration Options

Complete list of configuration options:

```typescript
interface Config {
  // Core settings
  rootDirectory: string;
  generatedFileName: string;
  
  // Output formats
  generateText: boolean;      // .txt format
  generateMarkdown: boolean;  // .md format
  generateHtml: boolean;      // .html format
  
  // Processing limits
  maxFileSizeKB: number;      // Per-file size limit
  maxFiles: number;           // Total file count limit
  maxTotalSizeMB: number;     // Total size limit
  
  // Directory scanning
  parseSubDirectories: boolean;
  useGitIgnoreForExcludes: boolean;
  ignorePatterns: string[];
  
  // File types
  parsedFileExtensions: {
    web: string[];
    backend: string[];
    config: string[];
    scripts: string[];
    cpp: string[];
    godot: string[];
    doc: string[];
    [key: string]: string[];  // Custom groups
  };
  
  // Security
  allowSymlinks: boolean;
  
  // User experience
  copyToClipboard: boolean;
}
```

### Error Handling

```javascript
import { fusionAPI } from 'project-fusion/api';

try {
  const result = await fusionAPI({
    rootDirectory: './nonexistent'
  });
  
  if (!result.success) {
    console.error('Fusion failed:', result.message);
    if (result.error) {
      console.error('Error details:', result.error);
    }
  }
} catch (error) {
  console.error('Unexpected error:', error);
}
```

### Plugin Integration via API

```javascript
import { fusionAPI } from 'project-fusion/api';

const result = await fusionAPI({
  rootDirectory: './src',
  // Plugin configuration
  pluginsDir: './plugins',
  enabledPlugins: ['minifier', 'security-scanner']
});
```

## Performance Optimization

### Configuration for Large Projects

```json
{
  "maxFileSizeKB": 2048,
  "maxFiles": 1000,
  "maxTotalSizeMB": 50,
  "parseSubDirectories": true,
  "useGitIgnoreForExcludes": true,
  "ignorePatterns": [
    "node_modules/",
    "dist/",
    "coverage/",
    "*.min.js",
    "*.map"
  ]
}
```

### Memory Management

- Streaming file processing for reduced memory usage
- Configurable file size limits (`maxFileSizeKB`)
- Total size limits (`maxTotalSizeMB`)
- File count limits (`maxFiles`)

## Security Features

### Path Traversal Protection

All file paths are validated using `path.relative()`:

```typescript
const relativePath = path.relative(rootDir, filePath);
if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    throw new Error('Path traversal detected');
}
```

### Symbolic Link Protection

- Disabled by default
- Enable with `--allow-symlinks` CLI flag
- Uses `follow: false` in glob patterns

### XSS Prevention

HTML output escapes all user content:
- File paths
- File contents
- Metadata

## Output Format Details

### Text Format (.txt)
- Universal compatibility
- Clear file separators
- Metadata header
- Raw content preservation

### Markdown Format (.md)
- GitHub/GitLab compatible
- Syntax highlighting
- Table of contents with anchors
- Code blocks with language detection

### HTML Format (.html)
- Responsive design
- Interactive navigation
- Styled code blocks
- Self-contained (no external dependencies)

## Testing Best Practices

### Unit Testing
```bash
npm test
```

### Integration Testing
Use the VS Code launch configurations:
- "Fusion (Default)"
- "Fusion (Web)"
- "Init"
- "Config Check"

### End-to-End Testing
```bash
# Build and pack
npm run build
npm pack

# Test installation
npm install -g ./project-fusion-*.tgz
project-fusion --help

# Clean up
npm uninstall -g project-fusion
```

## Release Process

1. Update version in package.json
2. Update CHANGELOG.md
3. Run tests: `npm test`
4. Build: `npm run build`
5. Test package: `npm pack --dry-run`
6. Publish: `npm publish`
7. Create GitHub release
8. Update documentation

## Architecture Overview

### Core Components

- **CLI Layer** (`cli.ts`, `clicommands.ts`) - Command-line interface
- **Fusion Engine** (`fusion.ts`) - Core processing logic
- **Type System** (`types.ts`) - TypeScript type definitions
- **Validation** (`schema.ts`) - Zod schema validation
- **Utilities** (`utils.ts`) - Helper functions
- **APIs** (`api.ts`, `fluent.ts`) - Programmatic interfaces

### Extension Points

- **Plugins** - Hook-based extensibility
- **Output Strategies** - Custom output formats
- **File System Adapters** - Alternative file systems
- **Extension Groups** - Custom file categories