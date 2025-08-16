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
    if (config.parsing.maxFileSizeKB) {
        console.log(`   Max File Size: ${config.parsing.maxFileSizeKB} KB`);
    }

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