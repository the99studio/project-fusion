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
   - `project-fusioned.txt` - Plain text format with file separators
   - `project-fusioned.md` - Markdown format with syntax highlighting and table of contents
   - `project-fusioned.html` - HTML format with syntax highlighting and table of contents

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
   - **`.txt`** - Universal compatibility with file separators
   - **`.md`** - Syntax highlighting and table of contents
   - **`.html`** - Web format with responsive design and navigation
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

Project Fusion supports 35+ file extensions organized by category:
- **Web**: .js, .jsx, .ts, .tsx, .html, .css, .vue, .svelte
- **Backend**: .py, .rb, .java, .cs, .go, .rs, .php
- **Config**: .json, .yaml, .yml, .toml, .xml
- **Scripts**: .sh, .bat, .ps1, .cmd
- **C/C++**: .c, .cpp, .h, .hpp
- **Godot**: .gd, .tscn, .tres, .cfg

The markdown output applies syntax highlighting for each file type.

### HTML Output

Project Fusion can generate HTML files with:

- **Responsive Design**: Styling for viewing and sharing
- **Table of Contents**: Navigation with anchor links to each file
- **Syntax Highlighting**: Code blocks with language detection
- **File Metadata**: Timestamps and file counts in header
- **Layout**: Typography and spacing for readability

Enable HTML generation in your config:

```json
{
  "generateHtml": true
}
```

### Performance Features

- **File Size Limiting**: Configure `maxFileSizeKB` to skip large files (default: 1MB)
- **Streaming Support**: Process large projects with reduced memory usage
- **Performance Metrics**: Benchmarks logged including throughput and memory usage
- **Filtering**: Ignores binary files, images, archives, and compiled files

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

### API Reference

#### `fusionAPI(options: ProgrammaticFusionOptions): Promise<ProgrammaticFusionResult>`
Main API function for programmatic use with partial configuration.

#### `createConfig(overrides: Partial<Config>): Config`
Creates a complete configuration object with defaults.

#### `runFusion(config: Partial<Config> | Config, options?: FusionOptions): Promise<FusionResult>`
Runs fusion with a configuration object (partial or complete).

## Distribution

- **GitHub**: [github.com/the99studio/project-fusion](https://github.com/the99studio/project-fusion)
- **NPM**: [npmjs.com/package/project-fusion](https://www.npmjs.com/package/project-fusion)

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.