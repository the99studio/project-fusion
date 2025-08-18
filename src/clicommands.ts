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
import { defaultConfig, getExtensionsFromGroups, loadConfig } from './utils.js';

/**
 * Run the fusion command
 * @param options Command options
 */
export async function runFusionCommand(options: { extensions?: string, root?: string }): Promise<void> {
    try {
        console.log(chalk.blue('🔄 Starting Fusion Process...'));

        const config = await loadConfig();

        if (options.root) {
            config.rootDirectory = options.root;
            console.log(chalk.yellow(`ℹ️ Using specified directory as root: ${options.root}`));
        }

        // Parse extension groups from command line (comma-separated)
        let extensionGroups: string[] | undefined;
        if (options.extensions) {
            extensionGroups = options.extensions.split(',').map(e => e.trim());
            console.log(chalk.blue(`Using extension groups: ${extensionGroups.join(', ')}`));
        }

        const fusionOptions: FusionOptions = extensionGroups ? { extensionGroups } : {};
        const result = await processFusion(config, fusionOptions);

        if (result.success) {
            console.log(chalk.green(`✅ ${result.message}`));
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

            // Copy fusion content to clipboard if enabled (skip in CI/non-interactive environments)
            const isNonInteractive = process.env['CI'] === 'true' || !process.stdout.isTTY;
            if (config.copyToClipboard === true && result.fusionFilePath && !isNonInteractive) {
                try {
                    const fusionContent = await fs.readFile(result.fusionFilePath, 'utf8');
                    await clipboardy.write(fusionContent);
                    console.log(chalk.blue(`📋 Fusion content copied to clipboard`));
                } catch (clipboardError) {
                    console.warn(chalk.yellow(`⚠️ Could not copy to clipboard: ${String(clipboardError)}`));
                }
            } else if (config.copyToClipboard === true && isNonInteractive) {
                console.log(chalk.gray(`📋 Clipboard copy skipped (non-interactive environment)`));
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