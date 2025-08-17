# Project Fusion

Project Fusion merges multiple project files into a single file for sharing and collaboration. It generates three output formats: plain text (.txt), markdown (.md), and HTML (.html) with syntax highlighting.

## Prerequisites

- **Node.js** version 18.0.0 or higher

## Installation

Install Project Fusion globally with npm:

```bash
npm install -g project-fusion
```

## Quick Start

1. **Initialize** Project Fusion in your project directory to customize settings (optional):
   ```bash
   cd your-project-directory
   project-fusion init
   ```

2. **Create fusion files** containing your project files:
   ```bash
   project-fusion
   ```
   This creates three files:
   - `project-fusioned.txt` - Plain text format with clear file separators and metadata header
   - `project-fusioned.md` - Markdown format with syntax highlighting, table of contents, and clickable navigation
   - `project-fusioned.html` - HTML format with responsive design, interactive table of contents, and styled code blocks

3. **Share the fusion files** for collaboration or analysis

## Commands

- `project-fusion` - Create fusion files from project files (default action)
- `project-fusion init` - Create Project Fusion setting file (optional) in current directory
- `project-fusion config-check` - Validate configuration and show active settings
- `project-fusion --help` - Show help information

## Documentation

- **[CLAUDE.md](./CLAUDE.md)** - AI context and technical documentation
- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Development workflows and testing
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - How to contribute to the project
- **[LICENSE](./LICENSE)** - MIT License terms

## Usage Workflow

When sharing your code:

1. Run `project-fusion` to create merged files
2. Choose the appropriate format:
   - **`.txt`** - Universal compatibility, plain text with clear file separators and metadata
   - **`.md`** - GitHub-compatible markdown with syntax highlighting and clickable table of contents
   - **`.html`** - Web-ready format with responsive design, interactive navigation, and styled code blocks
3. Share the fusion file with colleagues or collaborators
4. Use for code review, AI analysis, documentation, or project overview

The fusion files contain your project files in a single, organized format.

## Configuration

Project Fusion creates a `project-fusion.json` configuration file when you run `init`. You can customize:
- File extensions to include (organized by category: web, backend, config, etc.)
- Directories to scan or ignore
- Output file names and locations
- Use of .gitignore patterns
- Clipboard copying behavior

### Supported File Extensions

Project Fusion supports 38 file extensions organized by category:
- **Web**: .css, .html, .js, .jsx, .svelte, .ts, .tsx, .vue
- **Backend**: .cs, .go, .java, .php, .py, .rb, .rs
- **Config**: .json, .toml, .xml, .yaml, .yml
- **Scripts**: .bat, .cmd, .ps1, .sh
- **C/C++**: .c, .cc, .cpp, .h, .hpp
- **Godot**: .cfg, .cs, .gd, .import, .tscn, .tres
- **Documentation**: .adoc, .md, .rst

The markdown output applies syntax highlighting for each file type.

### Output Formats

Project Fusion generates three output formats simultaneously, each optimized for different use cases:

#### 📄 Text Format (`.txt`)
- **Purpose**: Universal compatibility for any text editor or system
- **Features**:
  - Clear file separators with descriptive headers (`<!-- FILE: path/to/file.js -->`)
  - Metadata header with project name, generation time, and file count
  - Raw code content without modification for maximum compatibility
  - Works with any text viewer, email, or system that supports plain text

#### 📝 Markdown Format (`.md`)
- **Purpose**: GitHub-compatible documentation with enhanced readability
- **Features**:
  - Automatic syntax highlighting based on file extensions
  - Interactive table of contents with anchor links to each file
  - Formatted headers and metadata for better visual presentation
  - Compatible with GitHub, GitLab, VS Code preview, and markdown renderers
  - Each file wrapped in appropriate code blocks (```language)

#### 🌐 HTML Format (`.html`)
- **Purpose**: Web-ready sharing with professional presentation
- **Features**:
  - Responsive design that works on desktop and mobile
  - Interactive table of contents with smooth scrolling navigation
  - Styled code blocks with proper syntax highlighting
  - Professional typography and spacing for readability
  - Self-contained file with embedded CSS (no external dependencies)
  - Click-to-navigate between files with anchor links

### Format Configuration

You can control which formats are generated in your `project-fusion.json` configuration:

```json
{
  "generateText": true,     // Enable .txt format
  "generateMarkdown": true, // Enable .md format  
  "generateHtml": true      // Enable .html format
}
```

All formats are enabled by default for maximum flexibility.

### Performance Features

- **File Size Limiting**: Configure `maxFileSizeKB` to skip large files (default: 1MB)
- **Streaming Support**: Process large projects with reduced memory usage
- **Performance Metrics**: Benchmarks logged including throughput and memory usage
- **Filtering**: Ignores binary files, images, archives, and compiled files

### Security Features

Project Fusion implements several security measures to protect against common attack vectors:

- **Path Traversal Protection**: All file paths are validated to ensure they remain within the configured root directory, preventing `../../../etc/passwd` style attacks
- **Symbolic Link Protection**: Symbolic links are detected and blocked by default to prevent directory traversal and access to files outside the project scope
- **Binary File Detection**: Binary files are automatically detected and skipped during processing to prevent corruption and improve performance
- **XSS Prevention**: All HTML output is properly escaped to prevent cross-site scripting attacks when sharing HTML fusion files
- **File System Security**: Uses `follow: false` in glob patterns to prevent following symbolic links during file discovery
- **Safe Error Handling**: Security-related errors are logged but don't expose sensitive path information to end users

These security features are enabled by default and require no additional configuration. All security validations are tested with comprehensive security test suites.

## Programmatic API

Project Fusion can be used as a library in other Node.js projects, such as VS Code extensions or build tools.

### Installation as a Dependency

```bash
npm install project-fusion
```

### Basic Usage

```typescript
import { fusionAPI, createConfig, runFusion } from 'project-fusion';

// Method 1: Simple API with partial config
const result = await fusionAPI({
    rootDirectory: '/path/to/project',
    generateHtml: false,
    parsedFileExtensions: {
        web: ['.ts', '.tsx'],
        backend: ['.py']
    }
});

// Method 2: Create config then run
const config = createConfig({
    generateHtml: false,
    maxFileSizeKB: 2048,
    ignorePatterns: ['tests/', '*.spec.ts']
});
const result = await runFusion(config);

// Method 3: Direct fusion with options
const result = await runFusion(
    { rootDirectory: '/my/project' },
    { extensionGroups: ['web', 'backend'] }
);
```

### VS Code Extension Example

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
            // Run fusion with dynamic config
            const result = await fusionAPI({
                rootDirectory: workspacePath,
                generateHtml: true,
                generateMarkdown: true,
                generateText: false,
                copyToClipboard: false,
                // Custom extensions for this workspace
                parsedFileExtensions: {
                    web: ['.ts', '.tsx', '.jsx'],
                    backend: [],
                    config: ['.json'],
                    cpp: [],
                    scripts: [],
                    godot: [],
                    doc: ['.md']
                }
            });
            
            if (result.success) {
                vscode.window.showInformationMessage(`Fusion completed: ${result.filesProcessed} files processed`);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Fusion failed: ${error.message}`);
        }
    });
    
    context.subscriptions.push(disposable);
}
```

### Advanced Usage Examples

#### Building Tool Integration

```typescript
import { fusionAPI } from 'project-fusion';
import { readFileSync } from 'fs';

// Integrate with a build system
async function generateProjectDocumentation(projectPath: string) {
    const packageJson = JSON.parse(readFileSync(`${projectPath}/package.json`, 'utf8'));
    
    const result = await fusionAPI({
        rootDirectory: projectPath,
        generatedFileName: `${packageJson.name}-docs`,
        generateText: false,        // Skip .txt for documentation
        generateMarkdown: true,     // Generate .md for GitHub
        generateHtml: true,         // Generate .html for hosting
        ignorePatterns: [
            'node_modules/',
            'dist/',
            '*.test.*',
            'coverage/'
        ],
        parsedFileExtensions: {
            web: ['.ts', '.tsx', '.js', '.jsx'],
            config: ['.json'],
            doc: ['.md']
        }
    });
    
    if (result.success) {
        console.log(`Documentation generated for ${packageJson.name}`);
        return result.fusionFilePath;
    } else {
        throw new Error(`Failed to generate docs: ${result.message}`);
    }
}
```

#### CI/CD Pipeline Example

```typescript
import { runFusion } from 'project-fusion';

// Use in GitHub Actions or other CI systems
async function generateReleaseArtifacts() {
    const config = {
        rootDirectory: process.env.GITHUB_WORKSPACE || process.cwd(),
        generatedFileName: `release-${process.env.GITHUB_SHA?.slice(0, 7)}`,
        copyToClipboard: false,     // Disable in CI
        maxFileSizeKB: 2048,       // Allow larger files
        ignorePatterns: [
            '.git/',
            'node_modules/',
            '*.log',
            'temp/'
        ]
    };
    
    const result = await runFusion(config, {
        extensionGroups: ['web', 'backend', 'config', 'doc']
    });
    
    if (result.success) {
        // Upload to release assets or artifact storage
        console.log(`Generated release artifacts at ${result.fusionFilePath}`);
    }
    
    return result;
}
```

#### Monorepo Support

```typescript
import { fusionAPI } from 'project-fusion';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';

// Process multiple packages in a monorepo
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
                },
                ignorePatterns: [
                    'node_modules/',
                    'dist/',
                    '*.spec.*'
                ]
            });
        })
    );
    
    const successful = results.filter(r => r.success);
    console.log(`Processed ${successful.length}/${packages.length} packages`);
    
    return results;
}
```

#### Custom File Processing

```typescript
import { createConfig, runFusion } from 'project-fusion';

// Create fusion for specific file types only
async function createTypescriptOnlyFusion(projectPath: string) {
    const config = createConfig({
        rootDirectory: projectPath,
        generatedFileName: 'typescript-only',
        generateText: true,
        generateMarkdown: false,
        generateHtml: false,
        parsedFileExtensions: {
            web: ['.ts', '.tsx'],      // Only TypeScript files
            backend: [],               // No backend files
            config: ['.json'],         // Only JSON configs
            scripts: [],               // No scripts
            cpp: [],                   // No C++ files
            godot: [],                 // No Godot files
            doc: []                    // No documentation files
        },
        ignorePatterns: [
            '*.test.ts',
            '*.spec.ts',
            '*.d.ts',                  // Skip type definitions
            'node_modules/',
            'dist/'
        ]
    });
    
    return await runFusion(config);
}
```

### API Reference

#### `fusionAPI(options: ProgrammaticFusionOptions): Promise<ProgrammaticFusionResult>`
Main API function for programmatic use with partial configuration.

**Parameters:**
- `options.rootDirectory?: string` - Project root directory
- `options.extensionGroups?: string[]` - Extension groups to include
- `options.generateText?: boolean` - Enable .txt format (default: true)
- `options.generateMarkdown?: boolean` - Enable .md format (default: true)
- `options.generateHtml?: boolean` - Enable .html format (default: true)
- `options.ignorePatterns?: string[]` - Custom ignore patterns
- `options.maxFileSizeKB?: number` - Maximum file size limit

#### `createConfig(overrides: Partial<Config>): Config`
Creates a complete configuration object with defaults.

#### `runFusion(config: Partial<Config> | Config, options?: FusionOptions): Promise<FusionResult>`
Runs fusion with a configuration object (partial or complete).

**Returns:** Promise resolving to FusionResult with success status, file paths, and error details.

## Distribution

- **GitHub**: [github.com/the99studio/project-fusion](https://github.com/the99studio/project-fusion)
- **NPM**: [npmjs.com/package/project-fusion](https://www.npmjs.com/package/project-fusion)

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.