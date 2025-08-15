# Generated Project Fusion File
**Project:** project-fusion

**Generated:** 2025-08-15T21:50:49.484Z

**Files:** 19

---

## 📁 Table of Contents

- [CHANGELOG.md](#changelog-md)
- [CLAUDE.md](#claude-md)
- [CONTRIBUTING.md](#contributing-md)
- [DEVELOPMENT.md](#development-md)
- [package.json](#package-json)
- [README.md](#readme-md)
- [src/cli.ts](#src-cli-ts)
- [src/clicommands.ts](#src-clicommands-ts)
- [src/fusion.ts](#src-fusion-ts)
- [src/index.ts](#src-index-ts)
- [src/schema.ts](#src-schema-ts)
- [src/types.ts](#src-types-ts)
- [src/utils.ts](#src-utils-ts)
- [tests/integration.test.ts](#tests-integration-test-ts)
- [tests/schema.test.ts](#tests-schema-test-ts)
- [tests/utils.test.ts](#tests-utils-test-ts)
- [TODO.md](#todo-md)
- [tsconfig.json](#tsconfig-json)
- [vitest.config.ts](#vitest-config-ts)

---

## 📄 CHANGELOG.md

```markdown
TODO
```

## 📄 CLAUDE.md

```markdown
# Project Fusion - AI Context

> 📖 **For Human Development**: See [DEVELOPMENT.md](./DEVELOPMENT.md) for detailed development workflows, testing procedures, and npm publication guide.

## Project Overview
Project Fusion merges multiple project files into a single file for easy sharing and collaboration.

## Essential Architecture
- **TypeScript 5.9.2** ESM project with strict type checking
- **CLI tool** built with Commander.js that generates .txt and .md fusion files
- **Configuration-driven** with Zod validation and default fallbacks
- **Multi-format output** with syntax highlighting and filtering

## Core Files Structure
```
src/
├── cli.ts              # CLI entry point
├── clicommands.ts      # Command implementations  
├── fusion.ts           # Core fusion logic
├── types.ts            # Type definitions (branded types)
├── schema.ts           # Zod validation schemas
├── utils.ts            # File operations & utilities
└── index.ts            # Main exports
```

## Key Commands
```bash
npm run build           # Build TypeScript → JavaScript
npm run typecheck       # Type checking only
project-fusion init     # Initialize config
project-fusion fusion   # Run fusion process
```

## Testing Directory
**⚠️ Important**: All testing and temporary files MUST be created in `temp/` directory at project root. This includes:
- Package testing: `temp/package/`
- File generation tests: `temp/test-files/`
- Any temporary artifacts: `temp/artifacts/`

The `temp/` directory is gitignored and safe for any testing activities.

## Configuration Schema
```typescript
{
  schemaVersion: 1
  fusion: { fusion_file: string, fusion_log: string, copyToClipboard: boolean }
  parsedFileExtensions: {
    web: string[]       // .js, .ts, .tsx, .vue, etc.
    backend: string[]   // .py, .go, .java, .rs, etc. 
    config: string[]    // .json, .yaml, .toml, etc.
    cpp: string[]       // .c, .cpp, .h, .hpp
    scripts: string[]   // .sh, .bat, .ps1
    godot: string[]     // .gd, .tscn, .tres
    doc: string[]       // .md, .rst, .adoc
  }
  parsing: { rootDirectory: string, parseSubDirectories: boolean }
  ignorePatterns: string[]
  useGitIgnoreForExcludes: boolean
}
```

## Core Workflow
1. Load `project-fusion.json` config with Zod validation
2. Scan files by extensions, apply .gitignore + custom ignore patterns
3. Generate dual output:
   - `project-fusioned.txt` - Plain text with separators
   - `project-fusioned.md` - Markdown with syntax highlighting + TOC

## Key Implementation Details
- **Branded types** (FilePath) prevent string confusion
- **Discriminated unions** (FusionResult) for type-safe error handling  
- **ESM modules** with strict TypeScript
- **Configuration fallbacks** - uses defaults if config missing/invalid

## Quick Reference
- **Add extensions**: Update `src/schema.ts` + `src/utils.ts` default config
- **Add commands**: Register in `src/cli.ts`, implement in `src/clicommands.ts`
- **Modify output**: Edit `src/fusion.ts` processing logic
```

## 📄 CONTRIBUTING.md

```markdown
# Contributing to Project Fusion

Thanks for your interest! This guide explains how to propose changes and report issues.

## Code of Conduct
Be respectful and constructive. By participating, you agree to foster an open and welcoming environment.

## How to contribute
1. **Fork** the repo and create a branch: `feat/<short-name>` or `fix/<short-name>`.
2. See [DEVELOPMENT.md](./DEVELOPMENT.md) for detailed development workflows, testing procedures, and npm publication guide.
3. Open a Pull Request with a clear description and checklist.

## PR checklist
- [ ] Feature/bugfix tested
- [ ] No regressions
- [ ] Docs/README updated if necessary
- [ ] Notable changes added to `CHANGELOG.md`

```

## 📄 DEVELOPMENT.md

```markdown
# Project Fusion - Development Guide

> 📋 **For Claude AI Context**: See [CLAUDE.md](./CLAUDE.md) for essential project information needed for development assistance.

## 🚀 Development Workflow

### Initial Setup
```bash
git clone https://github.com/the99studio/project-fusion.git
cd project-fusion
npm install
npm run build
```

### Testing the CLI
Use VS Code launch configurations (F5) for easy testing:
- **"Fusion (Default)"** - Default behavior (runs fusion)
- **"Fusion (Web)"** - Test web extensions only
- **"Help"** - Test CLI help
- **"Init"** - Test project initialization

### Testing with Real Package
For testing as if it were the real published package, see the [NPM Package Testing](#-npm-package-management) section below.

## 📦 NPM Package Management

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
npm install -g ./temp/package/

# Test commands (acts like real published package)
project-fusion --help
project-fusion --version
project-fusion init
project-fusion        # Default: runs fusion
project-fusion fusion

# Uninstall when done testing
npm uninstall -g project-fusion
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

## 🧪 Testing Strategy

### Manual Testing Checklist
- [ ] `npm run build` - clean build
- [ ] `npm run typecheck` - no type errors
- [ ] CLI help works: `project-fusion --help`
- [ ] Init works: `project-fusion init`
- [ ] Fusion works: `project-fusion fusion`
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

## 🔧 Troubleshooting

### Common Issues

**Build Errors:**
```bash
npm run clean && npm run build
```

**CLI Not Working After Changes:**
```bash
npm run build && npm link
```

**Package Contains Wrong Files:**
- Check `package.json` `files` field
- Use `npm pack --dry-run` to verify

**TypeScript Errors:**
```bash
npm run typecheck
# Fix errors in src/ files
```

### Performance Optimization
- Large projects: Use specific extension groups
- Memory issues: Configure ignore patterns properly
- Speed: Use `.gitignore` for filtering

## 📁 Directory Structure

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

## 🔗 Important Files

- **CLAUDE.md** - Essential project context for AI assistance
- **package.json** - NPM package configuration and scripts
- **tsconfig.json** - TypeScript compilation settings
- **.gitignore** - Git ignore patterns (includes `temp/`)
- **.vscode/launch.json** - VS Code debugging/testing configurations

## 🏗️ Architecture Notes

- **ESM modules** with NodeNext resolution
- **Branded types** for type safety (FilePath)
- **Discriminated unions** for results (success/failure)
- **Zod runtime validation** for configuration
- **Separation of concerns**: CLI ↔ core logic ↔ utilities

---

*For AI assistance, always refer to [CLAUDE.md](./CLAUDE.md) first for project context.*
```

## 📄 package.json

```json
{
    "name": "project-fusion",
    "version": "0.0.1",
    "description": "CLI tool for merging project files into a single file for easy sharing",
    "main": "dist/index.js",
    "types": "dist/index.d.ts",
    "type": "module",
    "bin": {
        "project-fusion": "dist/cli.js"
    },
    "exports": {
        ".": {
            "types": "./dist/index.d.ts",
            "import": "./dist/index.js"
        },
        "./package.json": "./package.json"
    },
    "files": [
        "dist/**/*",
        "README.md",
        "LICENSE"
    ],
    "sideEffects": false,
    "scripts": {
        "build": "tsc",
        "dev": "tsc --watch",
        "clean": "rm -rf dist",
        "test": "vitest",
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
        "typescript": "^5.9.2",
        "vitest": "^2.1.6"
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

- **[CLAUDE.md](./CLAUDE.md)** - AI context and technical documentation for Claude AI
- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Development workflows, testing, and npm publication guide
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
import pkg from '../package.json' with { type: 'json' };
import {
    runFusionCommand,
    runInitCommand,
    runConfigCheckCommand
} from './clicommands.js';

const program = new Command();

program
    .name('project-fusion')
    .description('Project Fusion - Efficient project file management and sharing')
    .version(pkg.version, '-v, --version')
    .option('--extensions <groups>', 'Comma-separated list of extension groups (e.g., backend,web)')
    .option('--root <directory>', 'Root directory to start scanning from (defaults to current directory)');

program
    .command('fusion')
    .description('Run fusion process to merge project files')
    .action((options, command) => {
        const allOptions = { ...command.parent.opts(), ...options };
        runFusionCommand(allOptions);
    });

program
    .command('init')
    .description('Initialize Project Fusion in the current directory')
    .option('--force', 'Force initialization even if configuration already exists')
    .action((options) => {
        runInitCommand(options);
    });

program
    .command('config-check')
    .description('Validate project-fusion.json and display active groups/extensions')
    .action(() => {
        runConfigCheckCommand();
    });

// Default behavior: run fusion if no command specified
// This allows users to just type 'project-fusion' to run fusion
async function runDefaultCommand() {
    const options: { extensions?: string; root?: string } = {};
    const args = process.argv.slice(2);
    
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

// Command detection logic: check if user provided an explicit command
// Otherwise, run fusion by default for better UX
const args = process.argv.slice(2);
const hasKnownCommand = args.some(arg => 
    ['init', 'fusion', 'config-check', '--help', '-h', '--version', '-v'].includes(arg)
);

if (hasKnownCommand) {
    program.parse(process.argv);
} else {
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
import { loadConfig, defaultConfig, getExtensionsFromGroups } from './utils.js';
import { ConfigSchemaV1 } from './schema.js';

/**
 * Run the fusion command
 * @param options Command options
 */
export async function runFusionCommand(options: { extensions?: string, root?: string }): Promise<void> {
    try {
        console.log(chalk.blue('🔄 Starting Fusion Process...'));

        const config = await loadConfig();

        if (options.root) {
            config.parsing.rootDirectory = options.root;
            console.log(chalk.yellow(`ℹ️ Using specified directory as root: ${options.root}`));
        }

        let extensionGroups: string[] | undefined;
        if (options.extensions) {
            extensionGroups = options.extensions.split(',').map(e => e.trim());
            console.log(chalk.blue(`Using extension groups: ${extensionGroups.join(', ')}`));
        }

        const fusionOptions: FusionOptions = { extensionGroups };
        const result = await processFusion(config, fusionOptions);

        if (result.success) {
            console.log(chalk.green(`✅ ${result.message}`));
            console.log(chalk.green(`📄 Fusion files created at:`));
            console.log(chalk.cyan(`   - ${result.fusionFilePath}`));
            console.log(chalk.cyan(`   - ${result.fusionFilePath.replace('.txt', '.md')}`));

            // Clipboard integration: only copy if explicitly enabled in config
            if (config.fusion?.copyToClipboard === true && result.fusionFilePath) {
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

/**
 * Run the config-check command to validate configuration
 */
export async function runConfigCheckCommand(): Promise<void> {
    try {
        console.log(chalk.blue('🔍 Checking Project Fusion Configuration...'));

        const configPath = path.resolve('./project-fusion.json');
        
        // Check if config file exists
        if (!await fs.pathExists(configPath)) {
            console.log(chalk.yellow('⚠️ No project-fusion.json found.'));
            console.log(chalk.cyan('   Using default configuration.'));
            console.log(chalk.gray('   Run "project-fusion init" to create a configuration file.'));
            
            await displayConfigInfo(defaultConfig, true);
            return;
        }

        // Read and parse config file
        let configContent: string;
        try {
            configContent = await fs.readFile(configPath, 'utf8');
        } catch (error) {
            console.log(chalk.red(`❌ Cannot read configuration file: ${error}`));
            process.exit(1);
        }

        let parsedConfig: any;
        try {
            parsedConfig = JSON.parse(configContent);
        } catch (error) {
            console.log(chalk.red(`❌ Invalid JSON in configuration file: ${error}`));
            process.exit(1);
        }

        // Validate with Zod
        const validation = ConfigSchemaV1.safeParse(parsedConfig);
        
        if (!validation.success) {
            console.log(chalk.red('❌ Configuration validation failed:'));
            
            // Display detailed error information
            validation.error.issues.forEach((issue, index) => {
                console.log(chalk.red(`   ${index + 1}. ${issue.path.join('.')}: ${issue.message}`));
            });
            
            console.log(chalk.yellow('\n💡 Suggestions:'));
            console.log(chalk.cyan('   - Check your configuration against the schema'));
            console.log(chalk.cyan('   - Run "project-fusion init --force" to reset to default config'));
            process.exit(1);
        }

        console.log(chalk.green('✅ Configuration is valid!'));
        await displayConfigInfo(validation.data, false);

    } catch (error) {
        console.error(chalk.red(`❌ Config check failed: ${error}`));
        process.exit(1);
    }
}

/**
 * Display configuration information
 */
async function displayConfigInfo(config: Config, isDefault: boolean): Promise<void> {
    console.log(chalk.blue('\n📋 Configuration Summary:'));
    
    if (isDefault) {
        console.log(chalk.gray('   (Using default configuration)\n'));
    } else {
        console.log('');
    }

    // Basic settings
    console.log(chalk.cyan('🔧 Basic Settings:'));
    console.log(`   Schema Version: ${config.schemaVersion}`);
    console.log(`   Root Directory: ${config.parsing.rootDirectory}`);
    console.log(`   Scan Subdirectories: ${config.parsing.parseSubDirectories ? 'Yes' : 'No'}`);
    console.log(`   Use .gitignore: ${config.useGitIgnoreForExcludes ? 'Yes' : 'No'}`);
    console.log(`   Copy to Clipboard: ${config.fusion.copyToClipboard ? 'Yes' : 'No'}`);

    // Output files
    console.log(chalk.cyan('\n📄 Output Files:'));
    console.log(`   Fusion File: ${config.fusion.fusion_file}`);
    console.log(`   Markdown File: ${config.fusion.fusion_file.replace('.txt', '.md')}`);
    console.log(`   Log File: ${config.fusion.fusion_log}`);

    // Extension groups
    console.log(chalk.cyan('\n📁 File Extension Groups:'));
    const totalExtensions = getExtensionsFromGroups(config);
    
    Object.entries(config.parsedFileExtensions).forEach(([group, extensions]) => {
        console.log(`   ${group}: ${extensions.length} extensions (${extensions.join(', ')})`);
    });
    
    console.log(chalk.gray(`   Total: ${totalExtensions.length} unique extensions`));

    // Ignore patterns
    console.log(chalk.cyan('\n🚫 Ignore Patterns:'));
    if (config.ignorePatterns.length === 0) {
        console.log('   None defined');
    } else {
        config.ignorePatterns.slice(0, 10).forEach(pattern => {
            console.log(`   ${pattern}`);
        });
        if (config.ignorePatterns.length > 10) {
            console.log(chalk.gray(`   ... and ${config.ignorePatterns.length - 10} more`));
        }
    }

    // File discovery preview
    console.log(chalk.cyan('\n🔍 File Discovery Preview:'));
    try {
        const { glob } = await import('glob');
        const rootDir = path.resolve(config.parsing.rootDirectory);
        
        const allExtensionsPattern = totalExtensions.map(ext => ext.startsWith('.') ? ext : `.${ext}`);
        const pattern = config.parsing.parseSubDirectories
            ? `${rootDir}/**/*@(${allExtensionsPattern.join('|')})`
            : `${rootDir}/*@(${allExtensionsPattern.join('|')})`;

        const filePaths = await glob(pattern, { 
            nodir: true,
            follow: false
        });

        console.log(`   Pattern: ${pattern}`);
        console.log(`   Files found: ${filePaths.length}`);
        
        if (filePaths.length > 0) {
            console.log(`   Sample files:`);
            filePaths.slice(0, 5).forEach(file => {
                const relativePath = path.relative(rootDir, file);
                console.log(`     ${relativePath}`);
            });
            if (filePaths.length > 5) {
                console.log(chalk.gray(`     ... and ${filePaths.length - 5} more`));
            }
        }
    } catch (error) {
        console.log(chalk.yellow(`   Could not preview files: ${error}`));
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

        await fs.writeFile(logFilePath, '');

        const extensions = getExtensionsFromGroups(config, options.extensionGroups);
        console.log(`Processing ${extensions.length} file extensions from ${Object.keys(config.parsedFileExtensions).length} categories`);
        
        if (extensions.length === 0) {
            const message = 'No file extensions to process.';
            await writeLog(logFilePath, `Status: Fusion failed\nReason: ${message}`, true);
            return { success: false, message, logFilePath };
        }

        const ig = ignoreLib();
        const rootDir = path.resolve(parsing.rootDirectory);

        // Apply .gitignore patterns for filtering if enabled
        if (config.useGitIgnoreForExcludes) {
            const gitIgnorePath = path.join(rootDir, '.gitignore');
            if (await fs.pathExists(gitIgnorePath)) {
                const gitIgnoreContent = await fs.readFile(gitIgnorePath, 'utf8');
                ig.add(gitIgnoreContent);
            }
        }

        if (config.ignorePatterns && config.ignorePatterns.length > 0) {
            const patterns = config.ignorePatterns
                .filter(pattern => pattern.trim() !== '' && !pattern.startsWith('#'))
                .join('\n');
            ig.add(patterns);
        }

        // Build glob pattern for file discovery
        const allExtensionsPattern = extensions.map(ext => ext.startsWith('.') ? ext : `.${ext}`);
        const pattern = parsing.parseSubDirectories
            ? `${rootDir}/**/*@(${allExtensionsPattern.join('|')})`
            : `${rootDir}/*@(${allExtensionsPattern.join('|')})`;

        let filePaths = await glob(pattern, { 
            nodir: true,
            follow: false
        });
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

        // Extract project metadata for the fusion header
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

        // Track which extensions are actually used vs configured vs unknown
        const foundExtensions = new Set<string>();
        const otherExtensions = new Set<string>();

        // Discover all file extensions in the project for reporting
        const allFilesPattern = parsing.parseSubDirectories ? `${rootDir}/**/*.*` : `${rootDir}/*.*`;
        const allFiles = await glob(allFilesPattern, { nodir: true, follow: false });

        const allConfiguredExtensions = Object.values(config.parsedFileExtensions).flat();
        const configuredExtensionSet = new Set(allConfiguredExtensions);
        for (const file of allFiles) {
            const relativePath = path.relative(rootDir, file);
            const ext = path.extname(file).toLowerCase();

            if (ext && !ig.ignores(relativePath) && !configuredExtensionSet.has(ext)) {
                otherExtensions.add(ext);
            }
        }

        const fileInfos: FileInfo[] = [];
        for (const filePath of filePaths) {
            try {
                const content = await readFileContent(filePath);
                const relativePath = path.relative(rootDir, filePath);

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

        fileInfos.sort((a, b) => a.path.localeCompare(b.path));

        // Generate plain text fusion file (.txt)
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

        await writeFileContent(fusionFilePath, fusionContent);
        
        // Generate enhanced markdown version with syntax highlighting
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
        
        mdContent += `## 📁 Table of Contents\n\n`;
        for (const fileInfo of fileInfos) {
            mdContent += `- [${fileInfo.path}](#${fileInfo.path.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()})\n`;
        }
        mdContent += `\n---\n\n`;
        
        for (const fileInfo of fileInfos) {
            const fileExt = path.extname(fileInfo.path).toLowerCase();
            const basename = path.basename(fileInfo.path);
            const language = getMarkdownLanguage(fileExt || basename);
            
            mdContent += `## 📄 ${fileInfo.path}\n\n`;
            mdContent += `\`\`\`${language}\n`;
            mdContent += `${fileInfo.content}\n`;
            mdContent += `\`\`\`\n\n`;
        }
        
        await writeFileContent(mdFilePath, mdContent);

        // Prepare success message and calculate processing metrics
        const message = `Fusion completed successfully. ${fileInfos.length} files processed.`;
        const endTime = new Date();
        const duration = ((endTime.getTime() - startTime.getTime()) / 1000).toFixed(2);
        
        // Generate comprehensive log summary
        
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

export * from './types.js';
export * from './schema.js';
export * from './utils.js';
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
    schemaVersion: z.literal(1),
    fusion: FusionConfigSchema,
    parsedFileExtensions: ParsedFileExtensionsSchema,
    parsing: ParsingConfigSchema,
    ignorePatterns: z.array(z.string()),
    useGitIgnoreForExcludes: z.boolean(),
});
```

## 📄 src/types.ts

```typescript
/**
 * Type definitions for the fusion functionality
 */

// Branded type for file paths to prevent string mixing
export type FilePath = string & { readonly __brand: unique symbol };

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
 * Discriminated union for fusion results - ensures type safety with success/failure states
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
 * Write log content to file and optionally to console
 * @param logFilePath Path to log file
 * @param content Content to log
 * @param append If true, append to existing file
 * @param consoleOutput If true, also display on console
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

        if (consoleOutput) {
            console.log(content);
        }
    } catch (error) {
        console.error('Error writing log:', error);
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
        return Object.values(config.parsedFileExtensions).flat();
    }

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
 * Map file extensions and basenames to markdown code block languages
 * @param extensionOrBasename File extension (e.g., '.ts', '.json') or basename (e.g., 'Makefile', 'Dockerfile')
 * @returns Markdown language identifier or empty string for text
 */
export function getMarkdownLanguage(extensionOrBasename: string): string {
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
        
        // Files without extensions (by basename)
        'Dockerfile': 'dockerfile',
        'dockerfile': 'dockerfile',
        'Makefile': 'makefile',
        'makefile': 'makefile',
        'CMakeLists.txt': 'cmake',
        'Rakefile': 'ruby',
        'Gemfile': 'ruby',
        'Vagrantfile': 'ruby',
        'Jenkinsfile': 'groovy',
        '.gitignore': 'text',
        '.gitattributes': 'text',
        '.htaccess': 'apache',
        'nginx.conf': 'nginx',
        'requirements.txt': 'text',
        'Cargo.lock': 'toml',
        'Cargo.toml': 'toml',
        'go.mod': 'go',
        'go.sum': 'text',
    };
    
    const lang = languageMap[extensionOrBasename.toLowerCase()] || languageMap[extensionOrBasename];
    return lang || 'text';  // Default to 'text' for unknown extensions
}
```

## 📄 tests/integration.test.ts

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { processFusion } from '../src/fusion.js';
import { defaultConfig } from '../src/utils.js';
import { Config } from '../src/types.js';

describe('integration', () => {
  const testDir = path.join(process.cwd(), 'temp', 'test-integration');
  const originalCwd = process.cwd();

  beforeEach(async () => {
    // Clean up and create test directory
    await fs.remove(testDir);
    await fs.ensureDir(testDir);
    
    // Change to test directory
    process.chdir(testDir);
  });

  afterEach(async () => {
    // Restore original directory
    process.chdir(originalCwd);
    
    // Clean up test directory
    await fs.remove(testDir);
  });

  describe('processFusion', () => {
    it('should process fusion successfully with test files', async () => {
      // Create test files
      await fs.writeFile('test.js', 'console.log("Hello World");');
      await fs.writeFile('test.ts', 'const message: string = "TypeScript";');
      await fs.writeFile('Dockerfile', 'FROM node:18\nCOPY . .\nRUN npm install');
      
      // Create config for test
      const testConfig: Config = {
        ...defaultConfig,
        parsing: {
          rootDirectory: '.',
          parseSubDirectories: false
        },
        parsedFileExtensions: {
          web: ['.js', '.ts']
        }
      };

      const result = await processFusion(testConfig);

      expect(result.success).toBe(true);
      expect(result.message).toContain('2 files processed');
      expect(result.fusionFilePath).toBeDefined();
      
      // Check if fusion files were created
      expect(await fs.pathExists(result.fusionFilePath!)).toBe(true);
      expect(await fs.pathExists(result.fusionFilePath!.replace('.txt', '.md'))).toBe(true);
      
      // Check content of fusion file
      const fusionContent = await fs.readFile(result.fusionFilePath!, 'utf8');
      expect(fusionContent).toContain('test.js');
      expect(fusionContent).toContain('test.ts');
      expect(fusionContent).toContain('console.log("Hello World");');
      expect(fusionContent).toContain('const message: string = "TypeScript";');
      expect(fusionContent).not.toContain('Dockerfile'); // Not in web extensions
    });

    it('should handle empty directory gracefully', async () => {
      const testConfig: Config = {
        ...defaultConfig,
        parsing: {
          rootDirectory: '.',
          parseSubDirectories: false
        }
      };

      const result = await processFusion(testConfig);

      expect(result.success).toBe(false);
      expect(result.message).toContain('No files found to process');
    });

    it('should respect ignore patterns', async () => {
      // Create test files
      await fs.writeFile('test.js', 'console.log("Hello World");');
      await fs.writeFile('ignored.js', 'console.log("Should be ignored");');
      
      const testConfig: Config = {
        ...defaultConfig,
        parsing: {
          rootDirectory: '.',
          parseSubDirectories: false
        },
        parsedFileExtensions: {
          web: ['.js']
        },
        ignorePatterns: ['ignored.js']
      };

      const result = await processFusion(testConfig);

      expect(result.success).toBe(true);
      expect(result.message).toContain('1 files processed'); // Only test.js
      
      const fusionContent = await fs.readFile(result.fusionFilePath!, 'utf8');
      expect(fusionContent).toContain('test.js');
      expect(fusionContent).not.toContain('ignored.js');
    });
  });
});
```

## 📄 tests/schema.test.ts

```typescript
import { describe, it, expect } from 'vitest';
import { ConfigSchemaV1 } from '../src/schema.js';
import { defaultConfig } from '../src/utils.js';

describe('schema', () => {
  describe('ConfigSchemaV1', () => {
    it('should validate default config', () => {
      const result = ConfigSchemaV1.safeParse(defaultConfig);
      expect(result.success).toBe(true);
    });

    it('should validate minimal valid config', () => {
      const minimalConfig = {
        schemaVersion: 1,
        fusion: {
          fusion_file: "test.txt",
          fusion_log: "test.log",
          copyToClipboard: false
        },
        parsedFileExtensions: {
          backend: [".py", ".go"],
          config: [".json"],
          cpp: [".c"],
          scripts: [".sh"],
          web: [".js", ".ts"],
          godot: [".gd"],
          doc: [".md"]
        },
        parsing: {
          rootDirectory: ".",
          parseSubDirectories: true
        },
        ignorePatterns: [],
        useGitIgnoreForExcludes: true
      };

      const result = ConfigSchemaV1.safeParse(minimalConfig);
      expect(result.success).toBe(true);
    });

    it('should reject config with invalid schema version', () => {
      const invalidConfig = {
        ...defaultConfig,
        schemaVersion: 2
      };

      const result = ConfigSchemaV1.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });

    it('should reject config with missing required fields', () => {
      const invalidConfig = {
        schemaVersion: 1
        // Missing required fields
      };

      const result = ConfigSchemaV1.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });

    it('should reject config with invalid copyToClipboard type', () => {
      const invalidConfig = {
        ...defaultConfig,
        fusion: {
          ...defaultConfig.fusion,
          copyToClipboard: "true" // Should be boolean
        }
      };

      const result = ConfigSchemaV1.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });

    it('should validate config with copyToClipboard true', () => {
      const validConfig = {
        ...defaultConfig,
        fusion: {
          ...defaultConfig.fusion,
          copyToClipboard: true
        }
      };

      const result = ConfigSchemaV1.safeParse(validConfig);
      expect(result.success).toBe(true);
    });
  });
});
```

## 📄 tests/utils.test.ts

```typescript
import { describe, it, expect } from 'vitest';
import { getMarkdownLanguage, getExtensionsFromGroups, formatTimestamp } from '../src/utils.js';
import { defaultConfig } from '../src/utils.js';

describe('utils', () => {
  describe('getMarkdownLanguage', () => {
    it('should return correct language for file extensions', () => {
      expect(getMarkdownLanguage('.ts')).toBe('typescript');
      expect(getMarkdownLanguage('.js')).toBe('javascript');
      expect(getMarkdownLanguage('.py')).toBe('python');
      expect(getMarkdownLanguage('.json')).toBe('json');
    });

    it('should return correct language for files without extensions', () => {
      expect(getMarkdownLanguage('Dockerfile')).toBe('dockerfile');
      expect(getMarkdownLanguage('Makefile')).toBe('makefile');
      expect(getMarkdownLanguage('Jenkinsfile')).toBe('groovy');
    });

    it('should return text for unknown extensions', () => {
      expect(getMarkdownLanguage('.unknown')).toBe('text');
      expect(getMarkdownLanguage('UnknownFile')).toBe('text');
    });

    it('should handle case insensitive extensions', () => {
      expect(getMarkdownLanguage('.TS')).toBe('typescript');
      expect(getMarkdownLanguage('.JS')).toBe('javascript');
    });
  });

  describe('getExtensionsFromGroups', () => {
    it('should return all extensions when no groups specified', () => {
      const extensions = getExtensionsFromGroups(defaultConfig);
      expect(extensions.length).toBeGreaterThan(0);
      expect(extensions).toContain('.js');
      expect(extensions).toContain('.py');
      expect(extensions).toContain('.json');
    });

    it('should return extensions for specific groups', () => {
      const extensions = getExtensionsFromGroups(defaultConfig, ['web']);
      expect(extensions).toContain('.js');
      expect(extensions).toContain('.ts');
      expect(extensions).toContain('.html');
      expect(extensions).not.toContain('.py');
    });

    it('should return extensions for multiple groups', () => {
      const extensions = getExtensionsFromGroups(defaultConfig, ['web', 'backend']);
      expect(extensions).toContain('.js');
      expect(extensions).toContain('.py');
      expect(extensions).toContain('.go');
    });

    it('should handle unknown groups gracefully', () => {
      const extensions = getExtensionsFromGroups(defaultConfig, ['unknown']);
      expect(extensions).toEqual([]);
    });
  });

  describe('formatTimestamp', () => {
    it('should format current date when no date provided', () => {
      const timestamp = formatTimestamp();
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should format provided date', () => {
      const date = new Date('2025-01-01T12:00:00.000Z');
      const timestamp = formatTimestamp(date);
      expect(timestamp).toBe('2025-01-01T12:00:00.000Z');
    });
  });
});
```

## 📄 TODO.md

```markdown
# Project Fusion — TODO

## 🔴 PRIORITY 1 — Before 0.1.0 (Publish-Ready)
- [ ] Fix `package.json` to separate lib/CLI (`main`→`dist/index.js`, `types`, `exports`, `sideEffects:false`)
- [ ] Sync CLI version with `package.json` (import JSON in `src/cli.ts`)
- [ ] Harden security: `copyToClipboard === true` only + `glob({ follow:false })`
- [ ] Handle Makefile/Dockerfile without extension for syntax highlighting (`getMarkdownLanguage` via basename)
- [ ] Minimum unit tests (Vitest) for `utils`, `fusion`, `schema` (config OK/KO)
- [ ] `--config-check` command (validate `project-fusion.json` and display active groups/extensions)

## 🟠 PRIORITY 2 — Robustness & Performance
- [ ] **Streaming** (read/write by chunks) for large projects
- [ ] `maxFileSizeKB` option in config + skip/log large files
- [ ] Extend default `ignorePatterns`: `*.zip`, `*.tgz`, `*.png`, `*.jpg`, `*.jpeg`, `*.gif`, `*.pdf`, `*.unitypackage`
- [ ] Extend `ignorePatterns` for Unreal assets as well
- [ ] Basic benchmarks (project size, file count, duration, memory)

## 🟡 PRIORITY 3 — DX/UX
- [ ] Make `[root]` argument optional by default in CLI (implicit `project-fusion .`)
- [ ] More helpful Zod error messages (display path and faulty value)
- [ ] Improve generated file headers (project/package, local date, version)
- [ ] Add `--no-md` / `--no-txt` flag to select output formats

## 🔵 PRIORITY 4 — Quality & Ecosystem
- [ ] Test coverage (report) and README badge
- [ ] `CHANGELOG.md` (Conventional Commits) + `npm version` flow
- [ ] Additional exports (HTML/PDF) as options
- [ ] GitHub issue/PR templates + Code of Conduct
- [ ] Linting/style pass (ESLint + "state of the art" TS config)

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

## 📄 vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
});
```

