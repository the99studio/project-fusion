// SPDX-License-Identifier: MIT
// Copyright (c) 2025 the99studio
/**
 * CLI commands implementation
 */
import path from 'node:path';
import chalk from 'chalk';
import clipboardy from 'clipboardy';
import fs from 'fs-extra';
import { processFusion } from './fusion.js';
import { ConfigSchemaV1 } from './schema.js';
import type { Config, FusionOptions } from './types.js';
import { logger } from './utils/logger.js';
import { defaultConfig, getExtensionsFromGroups, loadConfig } from './utils.js';

/**
 * Run the fusion command
 * @param options Command options
 */
export async function runFusionCommand(options: { 
    allowSymlinks?: boolean;
    clipboard?: boolean;
    extensions?: string;
    excludeSecrets?: boolean;
    gitignore?: boolean;
    groups?: string;
    html?: boolean;
    maxFileSize?: string;
    maxFiles?: string;
    maxTotalSize?: string;
    md?: boolean;
    name?: string;
    out?: string;
    plugins?: string;
    pluginsDir?: string;
    root?: string;
    subdirs?: boolean;
    txt?: boolean;
    ignore?: string;
    preview?: boolean;
}): Promise<void> {
    try {
        logger.consoleInfo('🔄 Starting Fusion Process...');

        const config = await loadConfig();

        // Handle root directory
        if (options.root) {
            config.rootDirectory = options.root;
            console.log(chalk.yellow(`ℹ️ Using specified directory as root: ${options.root}`));
        }

        // Handle output directory
        if (options.out) {
            const outputPath = path.resolve(options.out);
            config.outputDirectory = outputPath;
            console.log(chalk.yellow(`ℹ️ Using output directory: ${outputPath}`));
        }

        // Handle custom filename
        if (options.name) {
            config.generatedFileName = options.name;
            console.log(chalk.yellow(`ℹ️ Using custom filename: ${options.name}`));
        }

        // Handle output format overrides
        if (options.html !== undefined || options.md !== undefined || options.txt !== undefined) {
            // If any format flag is specified, only generate those formats
            config.generateHtml = options.html ?? false;
            config.generateMarkdown = options.md ?? false;
            config.generateText = options.txt ?? false;
            
            const enabledFormats = [];
            if (config.generateHtml) enabledFormats.push('HTML');
            if (config.generateMarkdown) enabledFormats.push('Markdown');
            if (config.generateText) enabledFormats.push('Text');
            
            if (enabledFormats.length > 0) {
                console.log(chalk.yellow(`ℹ️ Generating only: ${enabledFormats.join(', ')} format${enabledFormats.length > 1 ? 's' : ''}`));
            } else {
                logger.consoleError('❌ No output formats selected. Please specify at least one: --html, --md, or --txt');
                process.exit(1);
            }
        }

        // Handle clipboard override
        if (options.clipboard === false) {
            config.copyToClipboard = false;
            logger.consoleWarning('ℹ️ Clipboard copying disabled');
        }

        if (options.allowSymlinks !== undefined) {
            config.allowSymlinks = options.allowSymlinks;
            if (options.allowSymlinks) {
                logger.consoleWarning('⚠️ SECURITY WARNING: Symbolic links processing is enabled. This may allow access to files outside the project directory.');
            }
        }


        // Handle size limits with validation
        if (options.maxFileSize) {
            const maxFileSize = Number.parseInt(options.maxFileSize, 10);
            if (Number.isNaN(maxFileSize) || maxFileSize <= 0) {
                logger.consoleError(`❌ Invalid value for --max-file-size: "${options.maxFileSize}". Expected a positive number (KB).`);
                process.exit(1);
            }
            config.maxFileSizeKB = maxFileSize;
            console.log(chalk.yellow(`ℹ️ Maximum file size set to: ${config.maxFileSizeKB} KB`));
        }
        if (options.maxFiles) {
            const maxFiles = Number.parseInt(options.maxFiles, 10);
            if (Number.isNaN(maxFiles) || maxFiles <= 0) {
                logger.consoleError(`❌ Invalid value for --max-files: "${options.maxFiles}". Expected a positive integer.`);
                process.exit(1);
            }
            config.maxFiles = maxFiles;
            console.log(chalk.yellow(`ℹ️ Maximum files set to: ${config.maxFiles}`));
        }
        if (options.maxTotalSize) {
            const maxTotalSize = Number.parseFloat(options.maxTotalSize);
            if (Number.isNaN(maxTotalSize) || maxTotalSize <= 0) {
                logger.consoleError(`❌ Invalid value for --max-total-size: "${options.maxTotalSize}". Expected a positive number (MB).`);
                process.exit(1);
            }
            config.maxTotalSizeMB = maxTotalSize;
            console.log(chalk.yellow(`ℹ️ Maximum total size set to: ${config.maxTotalSizeMB} MB`));
        }

        // Handle parsing behavior
        if (options.subdirs === false) {
            config.parseSubDirectories = false;
            console.log(chalk.yellow('ℹ️ Subdirectory parsing disabled'));
        }
        if (options.gitignore === false) {
            config.useGitIgnoreForExcludes = false;
            console.log(chalk.yellow('ℹ️ .gitignore exclusions disabled'));
        }
        if (options.excludeSecrets === false) {
            config.excludeSecrets = false;
            console.log(chalk.yellow('⚠️ Secret exclusion disabled - files may contain sensitive data'));
        }

        // Handle additional ignore patterns
        if (options.ignore) {
            const additionalPatterns = options.ignore.split(',').map(p => p.trim());
            config.ignorePatterns = [...config.ignorePatterns, ...additionalPatterns];
            console.log(chalk.yellow(`ℹ️ Added ignore patterns: ${additionalPatterns.join(', ')}`));
        }

        // Parse extension groups from command line (comma-separated)
        // Support both --extensions and --groups for convenience
        let extensionGroups: string[] | undefined;
        const groupsOption = options.extensions ?? options.groups;
        if (groupsOption) {
            extensionGroups = groupsOption.split(',').map(e => e.trim());
            console.log(chalk.blue(`Using extension groups: ${extensionGroups.join(', ')}`));
        }

        // Build fusion options with plugin support
        const fusionOptions: FusionOptions = {};
        
        if (extensionGroups) {
            fusionOptions.extensionGroups = extensionGroups;
        }
        
        // Handle plugins directory
        if (options.pluginsDir) {
            fusionOptions.pluginsDir = path.resolve(options.pluginsDir);
            console.log(chalk.blue(`📦 Loading plugins from: ${fusionOptions.pluginsDir}`));
        }
        
        // Handle enabled plugins list
        if (options.plugins) {
            fusionOptions.enabledPlugins = options.plugins.split(',').map(p => p.trim());
            console.log(chalk.blue(`🔌 Enabled plugins: ${fusionOptions.enabledPlugins.join(', ')}`));
        }

        // Handle preview mode
        if (options.preview) {
            console.log(chalk.blue('👁️ Preview Mode: Scanning files without generating output...'));
            fusionOptions.previewMode = true;
        }

        const result = await processFusion(config, fusionOptions);

        if (result.success) {
            console.log(chalk.green(`✅ ${result.message}`));
            
            // In preview mode, don't show generated files section
            if (!options.preview) {
                console.log(chalk.green(`📄 Generated files:`));
                
                if (config.generateText) {
                    console.log(chalk.cyan(`   - ${config.generatedFileName}.txt`));
                }
                if (config.generateMarkdown) {
                    console.log(chalk.cyan(`   - ${config.generatedFileName}.md`));
                }
                if (config.generateHtml) {
                    console.log(chalk.cyan(`   - ${config.generatedFileName}.html`));
                }

                // Copy fusion content to clipboard if enabled (skip in CI/non-interactive environments and large files)
                const isNonInteractive = process.env['CI'] === 'true' || !process.stdout.isTTY;
                if (config.copyToClipboard === true && result.fusionFilePath && !isNonInteractive) {
                    try {
                        // Check file size before reading (skip if > 5 MB)
                        const fileStats = await fs.stat(result.fusionFilePath);
                        const fileSizeMB = fileStats.size / (1024 * 1024);
                        
                        if (fileSizeMB > 5) {
                            console.log(chalk.gray(`📋 Clipboard copy skipped (file size: ${fileSizeMB.toFixed(1)} MB > 5 MB limit)`));
                        } else {
                            const fusionContent = await fs.readFile(result.fusionFilePath, 'utf8');
                            await clipboardy.write(fusionContent);
                            console.log(chalk.blue(`📋 Fusion content copied to clipboard`));
                        }
                    } catch (clipboardError) {
                        console.warn(chalk.yellow(`⚠️ Could not copy to clipboard: ${String(clipboardError)}`));
                    }
                } else if (config.copyToClipboard === true && isNonInteractive) {
                    console.log(chalk.gray(`📋 Clipboard copy skipped (non-interactive environment)`));
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
        console.error(chalk.red(`❌ Fusion process failed: ${String(error)}`));
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
        console.error(chalk.red(`❌ Initialization failed: ${String(error)}`));
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
        
        // Verify configuration file exists
        if (!await fs.pathExists(configPath)) {
            console.log(chalk.yellow('⚠️ No project-fusion.json found.'));
            console.log(chalk.cyan('   Using default configuration.'));
            console.log(chalk.gray('   Run "project-fusion init" to create a configuration file.'));
            
            await displayConfigInfo(defaultConfig, true);
            return;
        }

        // Load and parse configuration
        let configContent: string;
        try {
            configContent = await fs.readFile(configPath, 'utf8');
        } catch (error) {
            console.log(chalk.red(`❌ Cannot read configuration file: ${String(error)}`));
            process.exit(1);
        }

        let parsedConfig: unknown;
        try {
            parsedConfig = JSON.parse(configContent);
        } catch (error) {
            console.log(chalk.red(`❌ Invalid JSON in configuration file: ${String(error)}`));
            process.exit(1);
        }

        // Validate configuration against schema
        const validation = ConfigSchemaV1.safeParse(parsedConfig);
        
        if (!validation.success) {
            console.log(chalk.red('❌ Configuration validation failed:'));
            
            // Show detailed validation errors
            // Display detailed validation errors with helpful context
            for (const [index, issue] of validation.error.issues.entries()) {
                const path = issue.path.length > 0 ? issue.path.join('.') : 'root';
                 
                const value = issue.path.reduce((obj: unknown, key) => {
                    if (typeof key === 'string' && obj && typeof obj === 'object') {
                        return (obj as Record<string, unknown>)[key];
                    }
                    return undefined;
                }, parsedConfig);
                console.log(chalk.red(`   ${index + 1}. Path: ${chalk.yellow(path)}`));
                console.log(chalk.red(`      Error: ${issue.message}`));
                console.log(chalk.red(`      Current value: ${chalk.cyan(JSON.stringify(value))}`));
                if (issue.code === 'invalid_type') {
                     
                    console.log(chalk.red(`      Expected: ${chalk.green(String((issue as unknown as Record<string, unknown>)['expected']))}, received: ${chalk.magenta(String((issue as unknown as Record<string, unknown>)['received']))}`));
                }
            }
            
            console.log(chalk.yellow('\n💡 Suggestions:'));
            console.log(chalk.cyan('   - Check your configuration against the schema'));
            console.log(chalk.cyan('   - Run "project-fusion init --force" to reset to default config'));
            process.exit(1);
        }

        console.log(chalk.green('✅ Configuration is valid!'));
        await displayConfigInfo(validation.data, false);

    } catch (error) {
        console.error(chalk.red(`❌ Config check failed: ${String(error)}`));
        process.exit(1);
    }
}

/**
 * Display comprehensive configuration summary with preview
 */
async function displayConfigInfo(config: Config, isDefault: boolean): Promise<void> {
    const output: string[] = [];
    
    // Helper function to add both console and log output
    const addLine = (line: string, coloredLine?: string): void => {
        console.log(coloredLine ?? line);
        // eslint-disable-next-line no-control-regex
        output.push(line.replaceAll(/\u001B\[[\d;]*m/gu, '')); // Strip ANSI colors for log
    };

    addLine('\n📋 Configuration Summary:', chalk.blue('\n📋 Configuration Summary:'));
    
    if (isDefault) {
        addLine('   (Using default configuration)\n', chalk.gray('   (Using default configuration)\n'));
    } else {
        addLine('');
    }

    // Core configuration settings with diff highlighting
    addLine('🔧 Basic Settings:', chalk.cyan('🔧 Basic Settings:'));
    addLine(`   Schema Version: ${config.schemaVersion}${isDefault || config.schemaVersion === defaultConfig.schemaVersion ? '' : ' (modified)'}`,
           `   Schema Version: ${highlightDiff(config.schemaVersion.toString(), defaultConfig.schemaVersion.toString(), config.schemaVersion.toString())}`);
    addLine(`   Root Directory: ${config.rootDirectory}${isDefault || config.rootDirectory === defaultConfig.rootDirectory ? '' : ' (modified)'}`,
           `   Root Directory: ${highlightDiff(config.rootDirectory, defaultConfig.rootDirectory, config.rootDirectory)}`);
    addLine(`   Scan Subdirectories: ${config.parseSubDirectories ? 'Yes' : 'No'}${isDefault || config.parseSubDirectories === defaultConfig.parseSubDirectories ? '' : ' (modified)'}`,
           `   Scan Subdirectories: ${highlightDiff(config.parseSubDirectories ? 'Yes' : 'No', defaultConfig.parseSubDirectories ? 'Yes' : 'No', config.parseSubDirectories ? 'Yes' : 'No')}`);
    addLine(`   Use .gitignore: ${config.useGitIgnoreForExcludes ? 'Yes' : 'No'}${isDefault || config.useGitIgnoreForExcludes === defaultConfig.useGitIgnoreForExcludes ? '' : ' (modified)'}`,
           `   Use .gitignore: ${highlightDiff(config.useGitIgnoreForExcludes ? 'Yes' : 'No', defaultConfig.useGitIgnoreForExcludes ? 'Yes' : 'No', config.useGitIgnoreForExcludes ? 'Yes' : 'No')}`);
    addLine(`   Copy to Clipboard: ${config.copyToClipboard ? 'Yes' : 'No'}${isDefault || config.copyToClipboard === defaultConfig.copyToClipboard ? '' : ' (modified)'}`,
           `   Copy to Clipboard: ${highlightDiff(config.copyToClipboard ? 'Yes' : 'No', defaultConfig.copyToClipboard ? 'Yes' : 'No', config.copyToClipboard ? 'Yes' : 'No')}`);
    const symlinkValue = config.allowSymlinks ? 'Yes (⚠️ Security Risk)' : 'No (Secure)';
    const symlinkColor = config.allowSymlinks ? chalk.yellow(symlinkValue) : chalk.green(symlinkValue);
    addLine(`   Allow Symlinks: ${symlinkValue}${isDefault || config.allowSymlinks === defaultConfig.allowSymlinks ? '' : ' (modified)'}`,
           `   Allow Symlinks: ${isDefault || config.allowSymlinks === defaultConfig.allowSymlinks ? symlinkColor : chalk.yellow(symlinkValue)}`);
    addLine(`   Max File Size: ${config.maxFileSizeKB} KB${isDefault || config.maxFileSizeKB === defaultConfig.maxFileSizeKB ? '' : ' (modified)'}`,
           `   Max File Size: ${highlightDiff(`${config.maxFileSizeKB} KB`, `${defaultConfig.maxFileSizeKB} KB`, `${config.maxFileSizeKB} KB`)}`);
    addLine(`   Max Files: ${config.maxFiles.toLocaleString()}${isDefault || config.maxFiles === defaultConfig.maxFiles ? '' : ' (modified)'}`,
           `   Max Files: ${highlightDiff(config.maxFiles.toLocaleString(), defaultConfig.maxFiles.toLocaleString(), config.maxFiles.toLocaleString())}`);
    addLine(`   Max Total Size: ${config.maxTotalSizeMB} MB${isDefault || config.maxTotalSizeMB === defaultConfig.maxTotalSizeMB ? '' : ' (modified)'}`,
           `   Max Total Size: ${highlightDiff(`${config.maxTotalSizeMB} MB`, `${defaultConfig.maxTotalSizeMB} MB`, `${config.maxTotalSizeMB} MB`)}`);

    // File generation options
    addLine('\n📄 Output Generation:', chalk.cyan('\n📄 Output Generation:'));
    addLine(`   Generated File Name: ${config.generatedFileName}${isDefault || config.generatedFileName === defaultConfig.generatedFileName ? '' : ' (modified)'}`,
           `   Generated File Name: ${highlightDiff(config.generatedFileName, defaultConfig.generatedFileName, config.generatedFileName)}`);
    addLine(`   Generate Text: ${config.generateText ? 'Yes' : 'No'}${isDefault || config.generateText === defaultConfig.generateText ? '' : ' (modified)'}`,
           `   Generate Text: ${highlightDiff(config.generateText ? 'Yes' : 'No', defaultConfig.generateText ? 'Yes' : 'No', config.generateText ? 'Yes' : 'No')}`);
    addLine(`   Generate Markdown: ${config.generateMarkdown ? 'Yes' : 'No'}${isDefault || config.generateMarkdown === defaultConfig.generateMarkdown ? '' : ' (modified)'}`,
           `   Generate Markdown: ${highlightDiff(config.generateMarkdown ? 'Yes' : 'No', defaultConfig.generateMarkdown ? 'Yes' : 'No', config.generateMarkdown ? 'Yes' : 'No')}`);
    addLine(`   Generate HTML: ${config.generateHtml ? 'Yes' : 'No'}${isDefault || config.generateHtml === defaultConfig.generateHtml ? '' : ' (modified)'}`,
           `   Generate HTML: ${highlightDiff(config.generateHtml ? 'Yes' : 'No', defaultConfig.generateHtml ? 'Yes' : 'No', config.generateHtml ? 'Yes' : 'No')}`);
    addLine('   Log File: project-fusion.log');

    // File type configuration - structured table
    addLine('\n📁 File Extension Groups (Structured View):', chalk.cyan('\n📁 File Extension Groups (Structured View):'));
    displayExtensionGroupsTable(config, isDefault, addLine);

    // Pattern exclusions with diff
    addLine('\n🚫 Ignore Patterns:', chalk.cyan('\n🚫 Ignore Patterns:'));
    displayIgnorePatternsWithDiff(config, isDefault, addLine);

    // Preview matching files using current configuration
    addLine('\n🔍 File Discovery Preview:', chalk.cyan('\n🔍 File Discovery Preview:'));
    try {
        const { glob } = await import('glob');
        const rootDir = path.resolve(config.rootDirectory);
        const totalExtensions = getExtensionsFromGroups(config);
        
        // Create glob pattern to preview file discovery
        const allExtensionsPattern = totalExtensions.map(ext => ext.startsWith('.') ? ext : `.${ext}`);
        const pattern = config.parseSubDirectories
            ? `${rootDir}/**/*@(${allExtensionsPattern.join('|')})` // Recursive search
            : `${rootDir}/*@(${allExtensionsPattern.join('|')})`; // Root-only search

        const filePaths = await glob(pattern, { 
            nodir: true,
            follow: false
        });

        addLine(`   Pattern: ${pattern}`);
        addLine(`   Files found: ${filePaths.length}`);
        
        if (filePaths.length > 0) {
            addLine('   Sample files:');
            for (const file of filePaths.slice(0, 5)) {
                const relativePath = path.relative(rootDir, file);
                addLine(`     ${relativePath}`);
            }
            if (filePaths.length > 5) {
                addLine(`     ... and ${filePaths.length - 5} more`, chalk.gray(`     ... and ${filePaths.length - 5} more`));
            }
        }
    } catch (error) {
        addLine(`   Could not preview files: ${String(error)}`, chalk.yellow(`   Could not preview files: ${String(error)}`));
    }

    // Log the detailed config check output
    logger.info('Config check details logged', {
        configCheckOutput: output.join('\n'),
        isDefault,
        timestamp: new Date().toISOString()
    });
}

/**
 * Helper function to highlight differences from default values
 */
function highlightDiff(current: string, defaultValue: string, actualValue: string): string {
    return current === defaultValue ?
        chalk.green(actualValue) : // Default value - green
        chalk.yellow(actualValue); // Modified value - yellow
}

/**
 * Display extension groups in a structured table format
 */
function displayExtensionGroupsTable(config: Config, isDefault: boolean, addLine: (line: string, coloredLine?: string) => void): void {
    const totalExtensions = getExtensionsFromGroups(config);
    
    // Table header
    addLine('   ┌─────────────┬─────────┬────────────────────────────────────────────┐');
    addLine('   │ Group       │ Count   │ Extensions                                 │');
    addLine('   ├─────────────┼─────────┼────────────────────────────────────────────┤');
    
    // Table rows for each group
    for (const [group, extensions] of Object.entries(config.parsedFileExtensions)) {
        if (extensions) {
            const defaultExtensions = defaultConfig.parsedFileExtensions[group as keyof typeof defaultConfig.parsedFileExtensions] || [];
            const isModified = !isDefault && JSON.stringify(extensions) !== JSON.stringify(defaultExtensions);
            
            const groupPadded = group.padEnd(11);
            const countPadded = extensions.length.toString().padEnd(7);
            const extString = extensions.join(', ');
            const extTruncated = extString.length > 42 ? `${extString.slice(0, 39)  }...` : extString.padEnd(42);
            
            const line = `   │ ${groupPadded} │ ${countPadded} │ ${extTruncated} │`;
            const coloredLine = isModified 
                ? `   │ ${chalk.yellow(groupPadded)} │ ${chalk.yellow(countPadded)} │ ${chalk.yellow(extTruncated)} │`
                : `   │ ${chalk.green(groupPadded)} │ ${chalk.green(countPadded)} │ ${chalk.green(extTruncated)} │`;
            
            addLine(line, coloredLine);
        }
    }
    
    // Table footer
    addLine('   └─────────────┴─────────┴────────────────────────────────────────────┘');
    addLine(`   Total: ${totalExtensions.length} unique extensions`, 
           chalk.gray(`   Total: ${totalExtensions.length} unique extensions`));
    
    if (!isDefault) {
        addLine('   ', '   ');
        addLine('   Legend: ', chalk.gray('   Legend: '));
        addLine('   • Green: Default values', `   • ${chalk.green('Green: Default values')}`);
        addLine('   • Yellow: Modified from defaults', `   • ${chalk.yellow('Yellow: Modified from defaults')}`);
    }
}

/**
 * Display ignore patterns with diff highlighting
 */
function displayIgnorePatternsWithDiff(config: Config, isDefault: boolean, addLine: (line: string, coloredLine?: string) => void): void {
    if (config.ignorePatterns.length === 0) {
        addLine('   None defined');
        return;
    }
    
    const defaultPatterns = new Set(defaultConfig.ignorePatterns);
    const maxDisplay = 15;
    
    for (const pattern of config.ignorePatterns.slice(0, maxDisplay)) {
        const isDefaultPattern = isDefault || defaultPatterns.has(pattern);
        const line = `   ${pattern}`;
        const coloredLine = isDefaultPattern ? chalk.green(line) : chalk.yellow(line);
        addLine(line, coloredLine);
    }
    
    if (config.ignorePatterns.length > maxDisplay) {
        const remaining = config.ignorePatterns.length - maxDisplay;
        addLine(`   ... and ${remaining} more`, chalk.gray(`   ... and ${remaining} more`));
    }
    
    if (!isDefault) {
        // Show summary of modifications
        const added = config.ignorePatterns.filter(p => !defaultPatterns.has(p));
        const removed = defaultConfig.ignorePatterns.filter(p => !config.ignorePatterns.includes(p));
        
        if (added.length > 0 || removed.length > 0) {
            addLine('   ');
            addLine('   Pattern Changes:', chalk.gray('   Pattern Changes:'));
            if (added.length > 0) {
                addLine(`   • Added: ${added.length} pattern(s)`, chalk.yellow(`   • Added: ${added.length} pattern(s)`));
            }
            if (removed.length > 0) {
                addLine(`   • Removed: ${removed.length} pattern(s)`, chalk.red(`   • Removed: ${removed.length} pattern(s)`));
            }
        }
    }
}