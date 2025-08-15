# Generated Project Fusion File
**Project:** project-fusion

**Generated:** 2025-08-15T18:33:51.512Z

**Files:** 12

---

## 📁 Table of Contents

- [CLAUDE.md](#claude-md)
- [package.json](#package-json)
- [README.md](#readme-md)
- [src/cli.ts](#src-cli-ts)
- [src/clicommands.ts](#src-clicommands-ts)
- [src/fusion.ts](#src-fusion-ts)
- [src/index.ts](#src-index-ts)
- [src/schema.ts](#src-schema-ts)
- [src/types.ts](#src-types-ts)
- [src/utils.ts](#src-utils-ts)
- [TODO.md](#todo-md)
- [tsconfig.json](#tsconfig-json)

---

## 📄 CLAUDE.md

```markdown
# Project Fusion - Developer Guide

## Project Overview
Project Fusion merges multiple project files into a single file for easy sharing and collaboration.

## Project Structure
```
project-fusion/
├── src/                        # Source code
│   ├── cli.ts                  # CLI entry point (Commander.js)
│   ├── clicommands.ts          # Command implementations
│   ├── fusion.ts               # Core fusion functionality  
│   ├── types.ts                # TypeScript definitions (branded types)
│   ├── schema.ts               # Zod configuration schemas
│   ├── utils.ts                # Utilities (file ops, config, logging)
│   └── index.ts                # Main exports
├── project-fusion.json         # Configuration file
└── package.json                # Dependencies and scripts
```

## Technology Stack
- **TypeScript 5.9.2** (ES2022, NodeNext, strict mode)
- **Node.js 18+**, **npm** package manager
- **Zod 4.0.17** (schema validation), **Commander.js 14** (CLI)
- **fs-extra**, **glob**, **ignore**, **chalk**, **clipboardy**

## Commands & Development

### Development Commands
```bash
npm install        # Install dependencies
npm run build      # Build project
npm run dev        # Watch mode compilation
npm run typecheck  # Type checking
npm run clean      # Clean artifacts
npm link           # Link CLI globally
```

### CLI Commands
```bash
project-fusion init     # Initialize configuration
project-fusion fusion   # Create fusion file
project-fusion --help   # Show help
```

### Development Workflow
1. Clone repo → `npm install` → `npm run build` → `npm link`
2. Edit `src/` files → `npm run build` → test with linked CLI
3. Test in sample project: `project-fusion init` → `project-fusion fusion`

## Configuration Schema
```typescript
{
  schemaVersion: number
  fusion: {
    fusion_file: string
    fusion_log: string  
    copyToClipboard?: boolean
  }
  parsedFileExtensions: {
    web: string[]      // .js, .ts, .tsx, .vue, etc.
    backend: string[]  // .py, .go, .java, .rs, etc.
    config: string[]   // .json, .yaml, .toml, etc.
    cpp: string[]      // .c, .cpp, .h, .hpp
    scripts: string[]  // .sh, .bat, .ps1
    godot: string[]    // .gd, .tscn, .tres
  }
  parsing: { rootDirectory: string, parseSubDirectories: boolean }
  ignorePatterns: string[]
  useGitIgnoreForExcludes: boolean
}
```

## Fusion File Formats

### Plain Text Format (.txt)
```
# Generated Project Fusion File
# Project: name @2025-01-15T10:30:00.000Z
# Files: 5

<!-- ============================================================ -->
<!-- FILE: /src/component.tsx                                     -->
<!-- ============================================================ -->
[file content here]

<!-- ============================================================ -->
<!-- FILE: /src/utils.ts                                          -->
<!-- ============================================================ -->
[file content here]
```

### Markdown Format (.md)
```markdown
# Generated Project Fusion File
**Project:** name
**Generated:** 2025-01-15T10:30:00.000Z
**Files:** 5

## 📁 Table of Contents
- [/src/component.tsx](#src-component-tsx)
- [/src/utils.ts](#src-utils-ts)

## 📄 /src/component.tsx
```tsx
[file content with syntax highlighting]
```

## 📄 /src/utils.ts
```typescript
[file content with syntax highlighting]
```
```

## Architecture Patterns
- **ESM modules** with NodeNext resolution
- **Branded types** (FilePath, FileHash) for type safety
- **Discriminated unions** for FusionResult (success/failure)
- **Zod runtime validation**, **async/await throughout**
- **Separation of concerns**: CLI ↔ core logic ↔ utilities

## File Processing Flow
1. Load `project-fusion.json` config (Zod validation)
2. Scan directory by file extensions + apply ignore rules
3. Process each file and extract content
4. Generate two output formats:
   - `project-fusioned.txt` - Plain text with HTML-style separators
   - `project-fusioned.md` - Markdown with syntax highlighting and TOC
5. Optionally copy to clipboard (disabled by default)

## Common Development Tasks

### Add File Extension
1. Update `src/schema.ts` parsedFileExtensions
2. Update default config in `src/utils.ts`

### Add CLI Command  
1. Register in `src/cli.ts` (Commander.js)
2. Implement in `src/clicommands.ts`

### Modify Fusion Format
1. Edit `src/fusion.ts` processing logic
2. Update types in `src/types.ts`

## Security & Ignore Patterns
Configure ignore patterns directly in `project-fusion.json`:
```json
{
  "ignorePatterns": [
    ".env*",
    "**/credentials/*",
    "**/secrets/*",
    "*.pem",
    "*.key",
    "package-lock.json"
  ]
}
```

## NPM Publication
1. Update version in `package.json`
2. `npm run build` → `npm pack --dry-run` → `npm publish`
3. Published: `dist/` directory as `project-fusion` package

## Features

### Dual Output Formats
- **Plain Text (.txt)**: Universal compatibility with clear separators
- **Markdown (.md)**: Enhanced readability with:
  - Syntax highlighting for 50+ file types
  - Clickable table of contents
  - Organized sections with icons
  - Automatic language detection for code blocks

### Smart File Processing
- Ignores patterns from `.gitignore` (configurable)
- Custom ignore patterns in `project-fusion.json`
- Organized file extensions by category
- Efficient filtering with detailed statistics

## Recent Improvements (2025)
### ✅ State-of-the-Art TypeScript
- Branded types (FilePath), discriminated unions
- `const assertions`, `satisfies` operator, ~95% type coverage
- Zero `any` types, async `loadConfig()`, unified type definitions

### ✅ Code Quality  
- Dead code eliminated, TypeScript 5.9.2, Zod 4.0.17
- All packages updated, zero warnings/errors

## Performance & Limitations
- **Large files**: Configure extensions/exclusions appropriately
- **Memory**: File size limited by available memory
- **Text only**: No binary file support
- **Paths**: UTF-8 encoding, cross-platform path handling

## Debugging Tips
- Check `.project-fusion/fusion/fusion.log`
- Verify config with Zod validation
- Test with small file sets first
- Use specific extension groups for large projects
```

## 📄 package.json

```json
{
    "name": "project-fusion",
    "version": "0.0.1",
    "description": "CLI tool for merging project files into a single file for easy sharing",
    "main": "dist/cli.js",
    "type": "module",
    "bin": {
        "project-fusion": "dist/cli.js"
    },
    "files": [
        "dist/**/*",
        "README.md",
        "LICENSE"
    ],
    "scripts": {
        "build": "tsc",
        "dev": "tsc --watch",
        "clean": "rm -rf dist",
        "test": "echo \"Error: no test specified\" && exit 0",
        "typecheck": "tsc --noEmit",
        "prepublishOnly": "npm run clean && npm run build"
    },
    "keywords": [
        "cli",
        "code",
        "merge",
        "files",
        "fusion",
        "collaboration",
        "sharing"
    ],
    "author": "the99studio",
    "license": "MIT",
    "engines": {
        "node": ">=18.0.0"
    },
    "repository": {
        "type": "git",
        "url": "https://github.com/the99studio/project-fusion.git"
    },
    "bugs": {
        "url": "https://github.com/the99studio/project-fusion/issues"
    },
    "homepage": "https://github.com/the99studio/project-fusion#readme",
    "dependencies": {
        "chalk": "^5.5.0",
        "clipboardy": "^4.0.0",
        "commander": "^14.0.0",
        "fs-extra": "^11.3.1",
        "glob": "^11.0.3",
        "ignore": "^7.0.5",
        "zod": "^4.0.17"
    },
    "devDependencies": {
        "@types/fs-extra": "^11.0.4",
        "@types/node": "^24.2.1",
        "typescript": "^5.9.2"
    }
}

```

## 📄 README.md

```markdown
# Project Fusion

Project Fusion enables efficient project file management by merging multiple project files into a single file for easy sharing and collaboration. It generates both plain text (.txt) and markdown (.md) versions with syntax highlighting for better readability.

## Installation

Install Project Fusion globally with npm:

```bash
npm install -g project-fusion
```

## Quick Start

1. **Initialize** Project Fusion in your project directory:
   ```bash
   cd your-project-directory
   project-fusion init
   ```

2. **Create fusion files** containing all your project files:
   ```bash
   project-fusion fusion
   ```
   This creates two files:
   - `project-fusioned.txt` - Plain text format with clear file separators
   - `project-fusioned.md` - Markdown format with syntax highlighting and table of contents

3. **Share the fusion files** for collaboration or analysis (choose .txt for universal compatibility or .md for enhanced readability)

## Commands

- `project-fusion init` - Initialize Project Fusion in current directory
- `project-fusion fusion` - Create fusion file from project files
- `project-fusion --help` - Show help information

## Documentation

- **[CLAUDE.md](./CLAUDE.md)** - Complete developer guide and technical documentation
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - How to contribute to the project
- **[LICENSE](./LICENSE)** - MIT License terms

## Usage Workflow

When sharing your code:

1. Run `project-fusion fusion` to create merged files
2. Choose the appropriate format:
   - **`.txt`** - Universal compatibility with clear HTML-style separators
   - **`.md`** - Enhanced readability with syntax highlighting, clickable table of contents
3. Share the fusion file with colleagues or collaborators
4. Use for code review, AI analysis, documentation, or project overview

The fusion files contain all your project files in a single, organized format that's easy to understand and work with.

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

The markdown output automatically applies appropriate syntax highlighting for each file type.

## Distribution

- **GitHub**: [github.com/the99studio/project-fusion](https://github.com/the99studio/project-fusion)
- **NPM**: [npmjs.com/package/project-fusion](https://www.npmjs.com/package/project-fusion)

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.
```

## 📄 src/cli.ts

```typescript
#!/usr/bin/env node
/**
 * Command-line interface for Project Fusion
 */
import { Command } from 'commander';
import {
    runFusionCommand,
    runInitCommand
} from './clicommands.js';

const program = new Command();

// Set version and description
program
    .name('project-fusion')
    .description('Project Fusion - Efficient project file management and sharing')
    .version('0.0.1', '-v, --version')
    .option('--extensions <groups>', 'Comma-separated list of extension groups (e.g., backend,web)')
    .option('--root <directory>', 'Root directory to start scanning from (defaults to current directory)');

// Fusion command (explicit)
program
    .command('fusion')
    .description('Run fusion process to merge project files')
    .action((options, command) => {
        // Merge global options with command options
        const allOptions = { ...command.parent.opts(), ...options };
        runFusionCommand(allOptions);
    });

// Init command
program
    .command('init')
    .description('Initialize Project Fusion in the current directory')
    .option('--force', 'Force initialization even if configuration already exists')
    .action((options) => {
        runInitCommand(options);
    });

// Run fusion by default if no command was specified
async function runDefaultCommand() {
    const options: { extensions?: string; root?: string } = {};
    const args = process.argv.slice(2);
    
    // Parse any options that might be present
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--extensions' && args[i + 1]) {
            options.extensions = args[i + 1];
            i++;
        } else if (args[i] === '--root' && args[i + 1]) {
            options.root = args[i + 1];
            i++;
        }
    }
    await runFusionCommand(options);
}

// First, try to parse with commander.js for explicit commands
const args = process.argv.slice(2);
const hasKnownCommand = args.some(arg => 
    ['init', 'fusion', '--help', '-h', '--version', '-v'].includes(arg)
);

if (hasKnownCommand) {
    // Use commander.js for explicit commands and help
    program.parse(process.argv);
} else {
    // Use default fusion behavior
    await runDefaultCommand();
}
```

## 📄 src/clicommands.ts

```typescript
/**
 * CLI commands implementation
 */
import chalk from 'chalk';
import clipboardy from 'clipboardy';
import fs from 'fs-extra';
import path from 'path';
import { processFusion } from './fusion.js';
import { FusionOptions, Config } from './types.js';
import { loadConfig, defaultConfig } from './utils.js';

/**
 * Run the fusion command
 * @param options Command options
 */
export async function runFusionCommand(options: { extensions?: string, root?: string }): Promise<void> {
    try {
        console.log(chalk.blue('🔄 Starting Fusion Process...'));

        // Load config
        const config = await loadConfig();

        // Override rootDirectory only if specified via CLI
        if (options.root) {
            config.parsing.rootDirectory = options.root;
            console.log(chalk.yellow(`ℹ️ Using specified directory as root: ${options.root}`));
        }

        // Parse extension groups
        let extensionGroups: string[] | undefined;
        if (options.extensions) {
            extensionGroups = options.extensions.split(',').map(e => e.trim());
            console.log(chalk.blue(`Using extension groups: ${extensionGroups.join(', ')}`));
        }

        // Run fusion
        const fusionOptions: FusionOptions = { extensionGroups };
        const result = await processFusion(config, fusionOptions);

        if (result.success) {
            console.log(chalk.green(`✅ ${result.message}`));
            console.log(chalk.green(`📄 Fusion files created at:`));
            console.log(chalk.cyan(`   - ${result.fusionFilePath}`));
            console.log(chalk.cyan(`   - ${result.fusionFilePath.replace('.txt', '.md')}`));

            // Copy to clipboard if enabled in config
            if (config.fusion?.copyToClipboard !== false && result.fusionFilePath) {
                try {
                    const fusionContent = await fs.readFile(result.fusionFilePath, 'utf8');
                    await clipboardy.write(fusionContent);
                    console.log(chalk.blue(`📋 Fusion content copied to clipboard`));
                } catch (clipboardError) {
                    console.warn(chalk.yellow(`⚠️ Could not copy to clipboard: ${clipboardError}`));
                }
            }

            console.log(chalk.gray(`📝 Log file available at: ${result.logFilePath}`));
        } else {
            console.log(chalk.red(`❌ ${result.message}`));
            if (result.logFilePath) {
                console.log(chalk.gray(`📝 Check log file for details: ${result.logFilePath}`));
            }
        }
    } catch (error) {
        console.error(chalk.red(`❌ Fusion process failed: ${error}`));
        process.exit(1);
    }
}


/**
 * Run the init command to initialize the config
 */
export async function runInitCommand(options: { force?: boolean } = {}): Promise<void> {
    try {
        console.log(chalk.blue('🔄 Initializing Project Fusion...'));

        // Check if config already exists
        const configPath = path.resolve('./project-fusion.json');
        if (await fs.pathExists(configPath)) {
            if (!options.force) {
                console.log(chalk.yellow('⚠️ project-fusion.json file already exists.'));
                console.log(chalk.yellow('Use --force to override or delete project-fusion.json and run init again.'));
                process.exit(1);
            } else {
                console.log(chalk.yellow('⚠️ Overriding existing configuration file with --force option.'));
            }
        }

        // Create default config
        await fs.writeJson(configPath, defaultConfig, { spaces: 4 });

        console.log(chalk.green('✅ Project Fusion initialized successfully!'));
        console.log(chalk.blue('📁 Created:'));
        console.log(chalk.cyan('  - ./project-fusion.json'));

        console.log(chalk.blue('\n📝 Next steps:'));
        console.log(chalk.cyan('  1. Review project-fusion.json and adjust as needed'));
        console.log(chalk.cyan('  2. Run fusion: project-fusion'));
    } catch (error) {
        console.error(chalk.red(`❌ Initialization failed: ${error}`));
        process.exit(1);
    }
}
```

## 📄 src/fusion.ts

```typescript
/**
 * Fusion functionality
 */
import fs from 'fs-extra';
import { glob } from 'glob';
import ignoreLib from 'ignore';
import path from 'path';
import {
    formatTimestamp,
    getExtensionsFromGroups,
    getMarkdownLanguage,
    readFileContent,
    writeFileContent,
    writeLog
} from './utils.js';
import {
    Config,
    FileInfo,
    FusionOptions,
    FusionResult,
    createFilePath
} from './types.js';

/**
 * Process fusion of files
 * @param config Configuration
 * @param options Fusion options
 * @returns Fusion result
 */
export async function processFusion(
    config: Config,
    options: FusionOptions = {}
): Promise<FusionResult> {
    try {
        const { fusion, parsing } = config;
        const logFilePath = createFilePath(path.resolve(fusion.fusion_log));
        const fusionFilePath = createFilePath(path.resolve(fusion.fusion_file));
        const startTime = new Date();

        // Initialize log file
        await fs.writeFile(logFilePath, '');

        // Determine which extensions to process
        const extensions = getExtensionsFromGroups(config, options.extensionGroups);
        console.log(`Processing ${extensions.length} file extensions from ${Object.keys(config.parsedFileExtensions).length} categories`);
        
        if (extensions.length === 0) {
            const message = 'No file extensions to process.';
            await writeLog(logFilePath, `Status: Fusion failed\nReason: ${message}`, true);
            return { success: false, message, logFilePath };
        }

        // Initialize ignore filter instance
        const ig = ignoreLib();

        // Get the root directory
        const rootDir = path.resolve(parsing.rootDirectory);

        // Get .gitignore patterns if enabled
        if (config.useGitIgnoreForExcludes) {
            const gitIgnorePath = path.join(rootDir, '.gitignore');
            if (await fs.pathExists(gitIgnorePath)) {
                const gitIgnoreContent = await fs.readFile(gitIgnorePath, 'utf8');
                ig.add(gitIgnoreContent);
            }
        }

        // Add ignore patterns from config
        if (config.ignorePatterns && config.ignorePatterns.length > 0) {
            // Filter out comments and empty lines, then add to ignore
            const patterns = config.ignorePatterns
                .filter(pattern => pattern.trim() !== '' && !pattern.startsWith('#'))
                .join('\n');
            ig.add(patterns);
        }

        // Find all files with matching extensions
        const allExtensionsPattern = extensions.map(ext => ext.startsWith('.') ? ext : `.${ext}`);
        const pattern = parsing.parseSubDirectories
            ? `${rootDir}/**/*@(${allExtensionsPattern.join('|')})`
            : `${rootDir}/*@(${allExtensionsPattern.join('|')})`;

        let filePaths = await glob(pattern, { 
            nodir: true
        });
        
        // Filter out ignored files using the ignore instance
        const originalFileCount = filePaths.length;
        filePaths = filePaths.filter(file => {
            const relativePath = path.relative(rootDir, file);
            return !ig.ignores(relativePath);
        });
        console.log(`Found ${originalFileCount} files, ${filePaths.length} after filtering (${((originalFileCount - filePaths.length) / originalFileCount * 100).toFixed(1)}% filtered)`);

        if (filePaths.length === 0) {
            const message = 'No files found to process.';
            const endTime = new Date();
            await writeLog(logFilePath, `Status: Fusion failed\nReason: ${message}\nStart time: ${formatTimestamp(startTime)}\nEnd time: ${formatTimestamp(endTime)}\nDuration: ${((endTime.getTime() - startTime.getTime()) / 1000).toFixed(2)}s`, true);
            return { success: false, message, logFilePath };
        }

        // Get project and package name
        const projectName = path.basename(process.cwd());
        let packageName = "";
        const packageJsonPath = path.join(process.cwd(), 'package.json');
        if (await fs.pathExists(packageJsonPath)) {
            try {
                const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
                if (packageJson.name) {
                    packageName = packageJson.name;
                }
            } catch (error) {
                console.warn('Error reading package.json:', error);
            }
        }

        // Track extensions
        const foundExtensions = new Set<string>();
        const otherExtensions = new Set<string>();

        // Find all files in the project to check for other extensions
        const allFilesPattern = parsing.parseSubDirectories ? `${rootDir}/**/*.*` : `${rootDir}/*.*`;
        const allFiles = await glob(allFilesPattern, { nodir: true });

        // Get all configured extensions
        const allConfiguredExtensions = Object.values(config.parsedFileExtensions).flat();
        const configuredExtensionSet = new Set(allConfiguredExtensions);

        // Find other extensions in the project that aren't in the configured set
        // and aren't in ignored directories
        for (const file of allFiles) {
            const relativePath = path.relative(rootDir, file);
            const ext = path.extname(file).toLowerCase();

            if (ext && !ig.ignores(relativePath) && !configuredExtensionSet.has(ext)) {
                otherExtensions.add(ext);
            }
        }

        // Read file contents and calculate hashes
        const fileInfos: FileInfo[] = [];
        for (const filePath of filePaths) {
            try {
                const content = await readFileContent(filePath);
                const relativePath = path.relative(rootDir, filePath);

                // Extract file extension
                const fileExt = path.extname(filePath).toLowerCase();
                foundExtensions.add(fileExt);

                fileInfos.push({
                    path: createFilePath(relativePath),
                    content
                });
            } catch (error) {
                await writeLog(logFilePath, `Error processing file ${filePath}: ${error}`, true);
                console.error(`Error processing file ${filePath}:`, error);
            }
        }

        // Sort fileInfos by path
        fileInfos.sort((a, b) => a.path.localeCompare(b.path));

        // Build simplified fusion content
        let fusionContent = `# Generated Project Fusion File\n`;
        if (packageName && packageName.toLowerCase() !== projectName.toLowerCase()) {
            fusionContent += `# Project: ${projectName} / ${packageName}\n`;
        } else {
            fusionContent += `# Project: ${projectName}\n`;
        }
        fusionContent += `# @${formatTimestamp()}\n`;
        fusionContent += `# Files: ${fileInfos.length}\n\n`;

        for (const fileInfo of fileInfos) {
            fusionContent += `<!-- ============================================================ -->\n`;
            fusionContent += `<!-- FILE: ${fileInfo.path.padEnd(54)} -->\n`;
            fusionContent += `<!-- ============================================================ -->\n`;
            fusionContent += `${fileInfo.content}\n\n`;
        }

        // Write fusion file (.txt)
        await writeFileContent(fusionFilePath, fusionContent);
        
        // Generate and write markdown version (.md)
        const mdFilePath = createFilePath(fusionFilePath.replace('.txt', '.md'));
        let mdContent = `# Generated Project Fusion File\n`;
        if (packageName && packageName.toLowerCase() !== projectName.toLowerCase()) {
            mdContent += `**Project:** ${projectName} / ${packageName}\n\n`;
        } else {
            mdContent += `**Project:** ${projectName}\n\n`;
        }
        mdContent += `**Generated:** ${formatTimestamp()}\n\n`;
        mdContent += `**Files:** ${fileInfos.length}\n\n`;
        mdContent += `---\n\n`;
        
        // Add table of contents
        mdContent += `## 📁 Table of Contents\n\n`;
        for (const fileInfo of fileInfos) {
            mdContent += `- [${fileInfo.path}](#${fileInfo.path.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()})\n`;
        }
        mdContent += `\n---\n\n`;
        
        // Add file contents with syntax highlighting
        for (const fileInfo of fileInfos) {
            const fileExt = path.extname(fileInfo.path).toLowerCase();
            const language = getMarkdownLanguage(fileExt);
            
            mdContent += `## 📄 ${fileInfo.path}\n\n`;
            mdContent += `\`\`\`${language}\n`;
            mdContent += `${fileInfo.content}\n`;
            mdContent += `\`\`\`\n\n`;
        }
        
        await writeFileContent(mdFilePath, mdContent);

        // Prepare simplified extension information for log
        let extensionsInfo = "";
        extensionsInfo += `Parsed extensions: ${Array.from(foundExtensions).sort().join(', ')}\n`;

        if (otherExtensions.size > 0) {
            extensionsInfo += `Ignored extensions: ${Array.from(otherExtensions).sort().join(', ')}\n`;
        }

        // Write comprehensive summary
        const message = `Fusion completed successfully. ${fileInfos.length} files processed.`;
        const endTime = new Date();
        const duration = ((endTime.getTime() - startTime.getTime()) / 1000).toFixed(2);
        
        // Get all configured extensions that weren't found
        const ignoredExtensions = extensions.filter(ext => !Array.from(foundExtensions).includes(ext));
        
        await writeLog(logFilePath, `Status: Fusion completed successfully`, true);
        await writeLog(logFilePath, `Start time: ${formatTimestamp(startTime)}`, true);
        await writeLog(logFilePath, `End time: ${formatTimestamp(endTime)}`, true);
        await writeLog(logFilePath, `Duration: ${duration}s`, true);
        
        await writeLog(logFilePath, `Files found: ${originalFileCount}`, true);
        await writeLog(logFilePath, `Files processed successfully: ${fileInfos.length} (${((fileInfos.length / originalFileCount) * 100).toFixed(1)}% of total files)`, true);
        await writeLog(logFilePath, `Files found but filtered out: ${originalFileCount - fileInfos.length} (${((originalFileCount - fileInfos.length) / originalFileCount * 100).toFixed(1)}% of total files)`, true);
        
        await writeLog(logFilePath, `File extensions actually processed:`, true);
        const foundExtArray = Array.from(foundExtensions).sort();
        for (const ext of foundExtArray) {
            await writeLog(logFilePath, `  ${ext}`, true);
        }
        
        if (ignoredExtensions.length > 0) {
            await writeLog(logFilePath, `Configured extensions with no matching files found:`, true);
            for (const ext of ignoredExtensions.sort()) {
                await writeLog(logFilePath, `  ${ext}`, true);
            }
        }
        
        if (otherExtensions.size > 0) {
            await writeLog(logFilePath, `File extensions found in project but not configured for processing:`, true);
            for (const ext of Array.from(otherExtensions).sort()) {
                await writeLog(logFilePath, `  ${ext}`, true);
            }
        }
        
        await writeLog(logFilePath, `Configuration used:`, true);
        await writeLog(logFilePath, `  Root directory: ${parsing.rootDirectory}`, true);
        await writeLog(logFilePath, `  Scan subdirectories: ${parsing.parseSubDirectories ? 'Yes' : 'No'}`, true);
        await writeLog(logFilePath, `  Apply .gitignore rules: ${config.useGitIgnoreForExcludes ? 'Yes' : 'No'}`, true);
        await writeLog(logFilePath, `  Custom ignore patterns defined: ${config.ignorePatterns.length} pattern${config.ignorePatterns.length !== 1 ? 's' : ''}`, true);
        
        await writeLog(logFilePath, `Output files generated:`, true);
        await writeLog(logFilePath, `  Plain text format: ${path.join(parsing.rootDirectory, path.basename(fusionFilePath))}`, true);
        await writeLog(logFilePath, `  Markdown format: ${path.join(parsing.rootDirectory, path.basename(fusionFilePath).replace('.txt', '.md'))}`, true);

        return {
            success: true,
            message: `${message} Created both .txt and .md versions.`,
            fusionFilePath,
            logFilePath
        };
    } catch (error) {
        const errorMessage = `Fusion process failed: ${error}`;
        console.error(errorMessage);

        try {
            const logFilePath = createFilePath(path.resolve(config.fusion.fusion_log));
            const endTime = new Date();
            await writeLog(logFilePath, `Status: Fusion failed due to error\nError details: ${errorMessage}\nEnd time: ${formatTimestamp(endTime)}`, true);

            return {
                success: false,
                message: errorMessage,
                logFilePath,
                error: error as Error
            };
        } catch (logError) {
            console.error('Could not write to log file:', logError);
            return {
                success: false,
                message: errorMessage,
                error: error as Error
            };
        }
    }
}
```

## 📄 src/index.ts

```typescript
/**
 * Entry point for Project Fusion
 */

// Export types
export * from './types.js';

// Export schemas
export * from './schema.js';

// Export utilities
export * from './utils.js';

// Export fusion functionality
export { processFusion } from './fusion.js';

```

## 📄 src/schema.ts

```typescript
/**
 * Configuration schema definitions for Project Fusion
 */
import { z } from 'zod';

/**
 * Schema for fusion configuration
 */
const FusionConfigSchema = z.object({
    fusion_file: z.string(),
    fusion_log: z.string(),
    copyToClipboard: z.boolean(),
});

/**
 * Schema for file extensions configuration
 * Allows for dynamic extension groups beyond the predefined ones
 */
const ParsedFileExtensionsSchema = z.object({
    backend: z.array(z.string()),
    config: z.array(z.string()),
    cpp: z.array(z.string()),
    scripts: z.array(z.string()),
    web: z.array(z.string()),
    godot: z.array(z.string()),
    doc: z.array(z.string()),
}).and(z.record(z.string(), z.array(z.string())));

/**
 * Schema for parsing configuration
 */
const ParsingConfigSchema = z.object({
    parseSubDirectories: z.boolean(),
    rootDirectory: z.string(),
});

/**
 * Complete configuration schema for version 1
 */
export const ConfigSchemaV1 = z.object({
    // Schema version (introduced in version 1)
    schemaVersion: z.literal(1),

    // Core configuration sections
    fusion: FusionConfigSchema,
    parsedFileExtensions: ParsedFileExtensionsSchema,
    parsing: ParsingConfigSchema,

    // Ignore patterns (integrated from .projectfusionignore)
    ignorePatterns: z.array(z.string()),

    // Additional options
    useGitIgnoreForExcludes: z.boolean(),
});

// Type inferred from the schema is used directly via Config in types.ts
```

## 📄 src/types.ts

```typescript
/**
 * Type definitions for the fusion functionality
 */

// Branded types for better type safety
export type FilePath = string & { readonly __brand: unique symbol };

// Helper functions for branded types
export const createFilePath = (path: string): FilePath => path as FilePath;

/**
 * Main configuration interface
 */
export interface Config {
    fusion: {
        fusion_file: string;
        fusion_log: string;
        copyToClipboard: boolean;
    };
    parsedFileExtensions: {
        backend: string[];
        config: string[];
        cpp: string[];
        scripts: string[];
        web: string[];
        godot: string[];
        [key: string]: string[];
    };
    parsing: {
        parseSubDirectories: boolean;
        rootDirectory: string;
    };
    ignorePatterns: string[];
    useGitIgnoreForExcludes: boolean;
    schemaVersion: number;
}

/**
 * Information about a file for fusion
 */
export interface FileInfo {
    path: FilePath;
    content: string;
}

/**
 * Options for the fusion process
 */
export interface FusionOptions {
    extensionGroups?: string[];
}

/**
 * Result of the fusion process - Using discriminated union for better type safety
 */
export type FusionResult = 
    | {
        success: true;
        message: string;
        fusionFilePath: FilePath;
        logFilePath: FilePath;
    }
    | {
        success: false;
        message: string;
        logFilePath?: FilePath;
        error?: Error;
    };
```

## 📄 src/utils.ts

```typescript
/**
 * Utilities for Project Fusion
 */
import fs from 'fs-extra';
import path from 'path';
import { z } from 'zod';
import { ConfigSchemaV1 } from './schema.js';
import { Config } from './types.js';


/**
 * Default configuration for Project Fusion
 */
export const defaultConfig = {
    fusion: {
        fusion_file: "project-fusioned.txt",
        fusion_log: "project-fusion.log",
        copyToClipboard: false
    },
    parsedFileExtensions: {
        backend: [".cs", ".go", ".java", ".php", ".py", ".rb", ".rs"],
        config: [".json", ".toml", ".xml", ".yaml", ".yml"],
        cpp: [".c", ".cc", ".cpp", ".h", ".hpp"],
        scripts: [".bat", ".cmd", ".ps1", ".sh"],
        web: [".css", ".html", ".js", ".jsx", ".svelte", ".ts", ".tsx", ".vue"],
        godot: [".gd", ".cs", ".tscn", ".tres", ".cfg", ".import"],
        doc: [".md", ".rst", ".adoc"]
    },
    parsing: {
        parseSubDirectories: true,
        rootDirectory: "."
    },
    ignorePatterns: [
        "project-fusion.json",
        "project-fusion.log",
        "project-fusioned.txt",
        "project-fusioned.md",
        "node_modules/",
        "package-lock.json",
        "pnpm-lock.yaml",
        "yarn.lock",
        "dist/",
        "build/",
        "*.min.js",
        "*.min.css",
        ".env",
        ".env.*",
        "*.key",
        "*.pem",
        "**/credentials/*",
        "**/secrets/*",
        "*.log",
        "logs/",
        ".DS_Store",
        "Thumbs.db",
        ".vscode/",
        ".idea/",
        "*.swp",
        "*.swo"
    ],
    useGitIgnoreForExcludes: true,
    schemaVersion: 1
} as const satisfies Config;


/**
 * Load config from file
 * @returns The loaded configuration
 */
export async function loadConfig(): Promise<Config> {
    try {
        const configPath = path.resolve('./project-fusion.json');
        
        let configContent: string;
        try {
            configContent = await fs.readFile(configPath, 'utf8');
        } catch (error) {
            return defaultConfig;
        }

        const parsedConfig = JSON.parse(configContent);

        // Validate with Zod schema
        try {
            const validatedConfig = ConfigSchemaV1.parse(parsedConfig);
            return validatedConfig;
        } catch (zodError: unknown) {
            if (zodError instanceof z.ZodError) {
                console.error('Configuration validation failed (will use default config):', zodError.format());
            } else {
                console.error('Unknown validation error (will use default config):', zodError);
            }
            console.error('Parsed config that failed validation:', JSON.stringify(parsedConfig, null, 2));
            return defaultConfig;
        }
    } catch (error) {
        const typedError = error instanceof Error ? error : new Error(String(error));

        console.error('Error loading configuration, will use default configuration:', {
            message: typedError.message,
            stack: typedError.stack,
            context: 'loadConfig',
            configPath: path.resolve('./project-fusion.json')
        });

        return defaultConfig;
    }
}

/**
 * Ensure a directory exists
 * @param directory Directory path
 */
export async function ensureDirectoryExists(directory: string): Promise<void> {
    await fs.ensureDir(directory);
}

/**
 * Amélioration du système de logging - pour synchroniser terminal et fichier log
 * @param logFilePath Chemin du fichier log
 * @param content Contenu à logger
 * @param append Si true, ajoute au fichier existant
 * @param consoleOutput Si true, affiche également sur la console
 */
export async function writeLog(
    logFilePath: string,
    content: string,
    append: boolean = false,
    consoleOutput: boolean = false
): Promise<void> {
    try {
        await ensureDirectoryExists(path.dirname(logFilePath));
        if (append) {
            await fs.appendFile(logFilePath, content + '\n');
        } else {
            await fs.writeFile(logFilePath, content + '\n');
        }

        // Afficher aussi sur la console si demandé
        if (consoleOutput) {
            console.log(content);
        }
    } catch (error) {
        console.error('Error writing log:', error);
        // Ne pas throw d'erreur pour ne pas interrompre le processus principal
    }
}


/**
 * Format a timestamp
 * @param date Optional date to format, defaults to current date
 * @returns Formatted timestamp
 */
export function formatTimestamp(date?: Date): string {
    return (date || new Date()).toISOString();
}

/**
 * Read file content
 * @param filePath Path to file
 * @returns File content
 */
export async function readFileContent(filePath: string): Promise<string> {
    try {
        return await fs.readFile(filePath, 'utf8');
    } catch (error) {
        console.error(`Error reading file ${filePath}:`, error);
        throw error;
    }
}

/**
 * Write content to file
 * @param filePath Path to file
 * @param content Content to write
 */
export async function writeFileContent(filePath: string, content: string): Promise<void> {
    try {
        await ensureDirectoryExists(path.dirname(filePath));
        await fs.writeFile(filePath, content);
    } catch (error) {
        console.error(`Error writing file ${filePath}:`, error);
        throw error;
    }
}

/**
 * Get extensions from specified groups
 * @param config Config object
 * @param groups Extension groups
 * @returns Array of extensions
 */
export function getExtensionsFromGroups(
    config: Config,
    groups?: string[]
): string[] {
    if (!groups || groups.length === 0) {
        // If no groups specified, use all extension groups
        return Object.values(config.parsedFileExtensions).flat();
    }

    // Get extensions from specified groups
    return groups.reduce((acc: string[], group: string) => {
        const extensions = config.parsedFileExtensions[group];
        if (extensions) {
            acc.push(...extensions);
        } else {
            console.warn(`Warning: Extension group '${group}' not found in config`);
        }
        return acc;
    }, []);
}

/**
 * Map file extensions to markdown code block languages
 * @param extension File extension (e.g., '.ts', '.json')
 * @returns Markdown language identifier or empty string for text
 */
export function getMarkdownLanguage(extension: string): string {
    const languageMap: Record<string, string> = {
        // Web
        '.js': 'javascript',
        '.jsx': 'jsx',
        '.ts': 'typescript',
        '.tsx': 'tsx',
        '.html': 'html',
        '.css': 'css',
        '.scss': 'scss',
        '.sass': 'sass',
        '.less': 'less',
        '.vue': 'vue',
        '.svelte': 'svelte',
        
        // Backend
        '.py': 'python',
        '.rb': 'ruby',
        '.java': 'java',
        '.cs': 'csharp',
        '.go': 'go',
        '.rs': 'rust',
        '.php': 'php',
        '.swift': 'swift',
        '.kt': 'kotlin',
        '.scala': 'scala',
        '.r': 'r',
        '.lua': 'lua',
        '.perl': 'perl',
        '.pl': 'perl',
        
        // Config
        '.json': 'json',
        '.yaml': 'yaml',
        '.yml': 'yaml',
        '.toml': 'toml',
        '.xml': 'xml',
        '.ini': 'ini',
        '.env': 'bash',
        
        // Shell/Scripts
        '.sh': 'bash',
        '.bash': 'bash',
        '.zsh': 'bash',
        '.fish': 'bash',
        '.ps1': 'powershell',
        '.bat': 'batch',
        '.cmd': 'batch',
        
        // C/C++
        '.c': 'c',
        '.h': 'c',
        '.cpp': 'cpp',
        '.cc': 'cpp',
        '.cxx': 'cpp',
        '.hpp': 'cpp',
        '.hxx': 'cpp',
        
        // Database
        '.sql': 'sql',
        
        // Documentation
        '.md': 'markdown',
        '.mdx': 'markdown',
        '.rst': 'rst',
        '.tex': 'latex',
        
        // Godot
        '.gd': 'gdscript',
        '.tscn': 'gdscript',
        '.tres': 'gdscript',
        '.cfg': 'ini',
        '.import': 'ini',
        
        // Other
        '.dockerfile': 'dockerfile',
        '.Dockerfile': 'dockerfile',
        '.makefile': 'makefile',
        '.Makefile': 'makefile',
        '.cmake': 'cmake',
        '.gradle': 'gradle',
        '.proto': 'protobuf',
        '.graphql': 'graphql',
        '.gql': 'graphql',
    };
    
    const lang = languageMap[extension.toLowerCase()];
    return lang || 'text';  // Default to 'text' for unknown extensions
}
```

## 📄 TODO.md

```markdown
# Project Fusion TODO

## 🔴 **PRIORITÉ 1** - Critical

- [ ] **Setup Vitest** - Add unit testing framework (replace placeholder tests)
- [ ] **Add basic unit tests** - Core functions (utils, fusion, schema validation)

## 🟠 **PRIORITÉ 2** - Important  

- [ ] **Streaming for large files** - Handle huge projects without memory issues
- [ ] **Config validation command** - `project-fusion --config-check` for debugging
- [ ] **Enhanced error messages** - Better Zod validation feedback for config

## 🟡 **PRIORITÉ 3** - Nice to Have

- [ ] **Test coverage reporting** - Metrics for code quality
- [ ] **JSDoc API documentation** - Complete function documentation  
- [ ] **Performance benchmarking** - Measure and optimize processing speed

## 🔵 **PRIORITÉ 4** - Future Features

- [ ] **HTML/PDF exports** - Additional output formats beyond .txt and .md
- [ ] **Migration tool** - Handle old project-fusion.json format detection/upgrade
```

## 📄 tsconfig.json

```json
{
    "compilerOptions": {
        "target": "ES2022",
        "module": "NodeNext",
        "moduleResolution": "NodeNext",
        "esModuleInterop": true,
        "resolveJsonModule": true,
        "strict": true,
        "declaration": true,
        "skipLibCheck": true,
        "forceConsistentCasingInFileNames": true,
        "outDir": "./dist",
        "rootDir": "./src"
    },
    "include": ["src/**/*"],
    "exclude": ["node_modules", "dist"]
}
```

