/**
 * CLI commands implementation
 */
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import clipboardy from 'clipboardy';
import { 
  loadConfig, 
  processFusion,
  FusionOptions,
  processApplyDiff,
  ApplyDiffOptions
} from 'project-fusion-core/dist/core.js';
import { 
  defaultConfig,
  defaultProjectFusionIgnoreContent
} from 'project-fusion-core/dist/coreutils.js';

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
      console.log(chalk.green(`📄 Fusion file created at: ${result.fusionFilePath}`));
      
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
 * Run the applydiff command
 * @param options Command options
 */
export async function runApplyDiffCommand(options: { skipHashValidation?: boolean }): Promise<void> {
  try {
    console.log(chalk.blue('🔄 Starting Apply Diff Process...'));
    
    // Load config
    const config = await loadConfig();
    
    // Run apply diff
    const applyDiffOptions: ApplyDiffOptions = { 
      skipHashValidation: options.skipHashValidation
    };
    
    const result = await processApplyDiff(config, applyDiffOptions);
    
    if (result.success) {
      console.log(chalk.green(`✅ ${result.message}`));
      
      if (result.changedFiles && result.changedFiles.length > 0) {
        console.log(chalk.blue(`Changed files (${result.changedFiles.length}):`));
        result.changedFiles.forEach(file => {
          console.log(chalk.cyan(`  - ${file}`));
        });
      }
      
      console.log(chalk.gray(`📝 Log file available at: ${result.logFilePath}`));
    } else {
      console.log(chalk.red(`❌ ${result.message}`));
      if (result.logFilePath) {
        console.log(chalk.gray(`📝 Check log file for details: ${result.logFilePath}`));
      }
    }
  } catch (error) {
    console.error(chalk.red(`❌ Apply diff process failed: ${error}`));
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

    // Check if ignore file already exists
    const projectFusionIgnorePath = path.resolve('./.projectfusionignore');
    if (await fs.pathExists(projectFusionIgnorePath)) {
      if (!options.force) {
        console.log(chalk.yellow('⚠️ .projectfusionignore file already exists.'));
        console.log(chalk.yellow('Use --force to override or delete .projectfusionignore and run init again.'));
        process.exit(1);
      } else {
        console.log(chalk.yellow('⚠️ Overriding existing configuration file with --force option.'));
      }
    }
    
    // Check if .project-fusion directory exists
    const projectFusionDir = path.resolve('./.project-fusion');
    if (await fs.pathExists(projectFusionDir)) {
      if (!options.force) {
        console.log(chalk.yellow('⚠️ The .project-fusion directory already exists.'));
        console.log(chalk.yellow('Use --force to override or delete the directory and run init again.'));
        process.exit(1);
      } else {
        console.log(chalk.yellow('⚠️ Using existing .project-fusion directory with --force option.'));
        // Clean up directory contents but keep the directory
        await fs.emptyDir(projectFusionDir);
      }
    }
    
    // Create default config
    await fs.writeJson(configPath, defaultConfig, { spaces: 2 });
    
    // Create directory structure
    await fs.ensureDir('./.project-fusion/fusion');
    await fs.ensureDir('./.project-fusion/applydiff');
    
    // Create example diff file
    const exampleDiffPath = path.join('./.project-fusion/applydiff', 'project_files_diff.txt.example');
    const exampleDiffContent = `### /components/Button.tsx
# Hash: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
--- a/components/Button.tsx
+++ b/components/Button.tsx
@@ -1,3 +1,3 @@
-old button code
+new button code
 unchanged line
-another old line
+another new line

### /components/Card.tsx [RENAME] /components/NewCard.tsx
# Hash: f8c3bf28b236ed1d3644dd5b66728c3413679c7e6efcb2a79da143e9c6bb19d0
--- a/components/Card.tsx
+++ b/components/NewCard.tsx
@@ -1,2 +1,2 @@
-old card code
+new card code
 unchanged line

### /components/Header.tsx [NEW]
export const Header = () => {
  return <header>New Component</header>;
};

### /components/Footer.tsx [DELETE]
`;
    await fs.writeFile(exampleDiffPath, exampleDiffContent);
    
    // Create .projectfusionignore if it doesn't exist
    const ignoreFilePath = path.resolve('./.projectfusionignore');
    if (!await fs.pathExists(ignoreFilePath)) {
      await fs.writeFile(ignoreFilePath, defaultProjectFusionIgnoreContent);
    }
    
    console.log(chalk.green('✅ Project Fusion initialized successfully!'));
    console.log(chalk.blue('📁 Created:'));
    console.log(chalk.cyan('  - ./project-fusion.json'));
    console.log(chalk.cyan('  - ./.project-fusion/fusion/'));
    console.log(chalk.cyan('  - ./.project-fusion/applydiff/'));
    console.log(chalk.cyan('  - ./.project-fusion/applydiff/project_files_diff.txt.example'));
    console.log(chalk.cyan('  - ./.projectfusionignore'));
    
    console.log(chalk.blue('\n📝 Next steps:'));
    console.log(chalk.cyan('  1. Review project-fusion.json and adjust as needed'));
    console.log(chalk.cyan('  2. Run fusion: project-fusion fusion'));
  } catch (error) {
    console.error(chalk.red(`❌ Initialization failed: ${error}`));
    process.exit(1);
  }
}