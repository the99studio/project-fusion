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
import { defaultConfig, getExtensionsFromGroups, loadConfig, logger } from './utils.js';

/**
 * Run the fusion command
 * @param options Command options
 */
export async function runFusionCommand(options: { 
    allowExternalPlugins?: boolean;
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
        logger.info('🔄 Starting Fusion Process...');

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
            config.generateHtml = options.html || false;
            config.generateMarkdown = options.md || false;
            config.generateText = options.txt || false;
            
            const enabledFormats = [];
            if (config.generateHtml) enabledFormats.push('HTML');
            if (config.generateMarkdown) enabledFormats.push('Markdown');
            if (config.generateText) enabledFormats.push('Text');
            
            if (enabledFormats.length > 0) {
                console.log(chalk.yellow(`ℹ️ Generating only: ${enabledFormats.join(', ')} format${enabledFormats.length > 1 ? 's' : ''}`));
            } else {
                logger.error('❌ No output formats selected. Please specify at least one: --html, --md, or --txt');
                process.exit(1);
            }
        }

        // Handle clipboard override
        if (options.clipboard === false) {
            config.copyToClipboard = false;
            logger.warning('ℹ️ Clipboard copying disabled');
        }

        if (options.allowSymlinks !== undefined) {
            config.allowSymlinks = options.allowSymlinks;
            if (options.allowSymlinks) {
                logger.warning('⚠️ SECURITY WARNING: Symbolic links processing is enabled. This may allow access to files outside the project directory.');
            }
        }

        if (options.allowExternalPlugins !== undefined) {
            config.allowExternalPlugins = options.allowExternalPlugins;
            if (options.allowExternalPlugins) {
                logger.warning('⚠️ SECURITY WARNING: External plugins loading is enabled. This allows executing code from outside the project directory.');
            }
        }

        // Handle size limits
        if (options.maxFileSize) {
            config.maxFileSizeKB = parseInt(options.maxFileSize, 10);
            console.log(chalk.yellow(`ℹ️ Maximum file size set to: ${config.maxFileSizeKB} KB`));
        }
        if (options.maxFiles) {
            config.maxFiles = parseInt(options.maxFiles, 10);
            console.log(chalk.yellow(`ℹ️ Maximum files set to: ${config.maxFiles}`));
        }
        if (options.maxTotalSize) {
            config.maxTotalSizeMB = parseFloat(options.maxTotalSize);
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
        const groupsOption = options.extensions || options.groups;
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
    console.log(chalk.blue('\n📋 Configuration Summary:'));
    
    if (isDefault) {
        console.log(chalk.gray('   (Using default configuration)\n'));
    } else {
        console.log('');
    }

    // Core configuration settings
    console.log(chalk.cyan('🔧 Basic Settings:'));
    console.log(`   Schema Version: ${config.schemaVersion}`);
    console.log(`   Root Directory: ${config.rootDirectory}`);
    console.log(`   Scan Subdirectories: ${config.parseSubDirectories ? 'Yes' : 'No'}`);
    console.log(`   Use .gitignore: ${config.useGitIgnoreForExcludes ? 'Yes' : 'No'}`);
    console.log(`   Copy to Clipboard: ${config.copyToClipboard ? 'Yes' : 'No'}`);
    console.log(`   Allow Symlinks: ${config.allowSymlinks ? chalk.yellow('Yes (⚠️ Security Risk)') : chalk.green('No (Secure)')}`);
    console.log(`   Max File Size: ${config.maxFileSizeKB} KB`);
    console.log(`   Max Files: ${config.maxFiles.toLocaleString()}`);
    console.log(`   Max Total Size: ${config.maxTotalSizeMB} MB`);

    // File generation options
    console.log(chalk.cyan('\n📄 Output Generation:'));
    console.log(`   Generated File Name: ${config.generatedFileName}`);
    console.log(`   Generate Text: ${config.generateText ? 'Yes' : 'No'}`);
    console.log(`   Generate Markdown: ${config.generateMarkdown ? 'Yes' : 'No'}`);
    console.log(`   Generate HTML: ${config.generateHtml ? 'Yes' : 'No'}`);
    console.log(`   Log File: project-fusion.log`);

    // File type configuration
    console.log(chalk.cyan('\n📁 File Extension Groups:'));
    const totalExtensions = getExtensionsFromGroups(config);
    
    for (const [group, extensions] of Object.entries(config.parsedFileExtensions)) {
        if (extensions) {
            console.log(`   ${group}: ${extensions.length} extensions (${extensions.join(', ')})`);
        }
    }
    
    console.log(chalk.gray(`   Total: ${totalExtensions.length} unique extensions`));

    // Pattern exclusions
    console.log(chalk.cyan('\n🚫 Ignore Patterns:'));
    if (config.ignorePatterns.length === 0) {
        console.log('   None defined');
    } else {
        for (const pattern of config.ignorePatterns.slice(0, 10)) {
            console.log(`   ${pattern}`);
        }
        if (config.ignorePatterns.length > 10) {
            console.log(chalk.gray(`   ... and ${config.ignorePatterns.length - 10} more`));
        }
    }

    // Preview matching files using current configuration
    console.log(chalk.cyan('\n🔍 File Discovery Preview:'));
    try {
        const { glob } = await import('glob');
        const rootDir = path.resolve(config.rootDirectory);
        
        // Create glob pattern to preview file discovery
        const allExtensionsPattern = totalExtensions.map(ext => ext.startsWith('.') ? ext : `.${ext}`);
        const pattern = config.parseSubDirectories
            ? `${rootDir}/**/*@(${allExtensionsPattern.join('|')})` // Recursive search
            : `${rootDir}/*@(${allExtensionsPattern.join('|')})`; // Root-only search

        const filePaths = await glob(pattern, { 
            nodir: true,
            follow: false
        });

        console.log(`   Pattern: ${pattern}`);
        console.log(`   Files found: ${filePaths.length}`);
        
        if (filePaths.length > 0) {
            console.log(`   Sample files:`);
            for (const file of filePaths.slice(0, 5)) {
                const relativePath = path.relative(rootDir, file);
                console.log(`     ${relativePath}`);
            }
            if (filePaths.length > 5) {
                console.log(chalk.gray(`     ... and ${filePaths.length - 5} more`));
            }
        }
    } catch (error) {
        console.log(chalk.yellow(`   Could not preview files: ${String(error)}`));
    }
}