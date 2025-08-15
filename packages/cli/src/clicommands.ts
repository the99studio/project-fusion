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
} from 'ai-code-sync-core/dist/core.js';
import { 
  defaultConfig,
  defaultAiCodeSyncIgnoreContent
} from 'ai-code-sync-core/dist/coreutils.js';

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
    console.log(chalk.blue('🔄 Initializing AICodeSync...'));
    
    // Check if config already exists
    const configPath = path.resolve('./ai-code-sync.json');
    if (await fs.pathExists(configPath)) {
      if (!options.force) {
        console.log(chalk.yellow('⚠️ ai-code-sync.json file already exists.'));
        console.log(chalk.yellow('Use --force to override or delete ai-code-sync.json and run init again.'));
        process.exit(1);
      } else {
        console.log(chalk.yellow('⚠️ Overriding existing configuration file with --force option.'));
      }
    }

    // Check if ignore file already exists
    const aiCodeSyncIgnorePath = path.resolve('./.aicodesyncignore');
    if (await fs.pathExists(aiCodeSyncIgnorePath)) {
      if (!options.force) {
        console.log(chalk.yellow('⚠️ .aicodesyncignore file already exists.'));
        console.log(chalk.yellow('Use --force to override or delete .aicodesyncignore and run init again.'));
        process.exit(1);
      } else {
        console.log(chalk.yellow('⚠️ Overriding existing configuration file with --force option.'));
      }
    }
    
    // Check if .ai-code-sync directory exists
    const aiCodeSyncDir = path.resolve('./.ai-code-sync');
    if (await fs.pathExists(aiCodeSyncDir)) {
      if (!options.force) {
        console.log(chalk.yellow('⚠️ The .ai-code-sync directory already exists.'));
        console.log(chalk.yellow('Use --force to override or delete the directory and run init again.'));
        process.exit(1);
      } else {
        console.log(chalk.yellow('⚠️ Using existing .ai-code-sync directory with --force option.'));
        // Clean up directory contents but keep the directory
        await fs.emptyDir(aiCodeSyncDir);
      }
    }
    
    // Create default config
    await fs.writeJson(configPath, defaultConfig, { spaces: 2 });
    
    // Create directory structure
    await fs.ensureDir('./.ai-code-sync/fusion');
    await fs.ensureDir('./.ai-code-sync/applydiff');
    
    // Create example diff file
    const exampleDiffPath = path.join('./.ai-code-sync/applydiff', 'project_files_diff.txt.example');
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
    
    // Create .aicodesyncignore if it doesn't exist
    const ignoreFilePath = path.resolve('./.aicodesyncignore');
    if (!await fs.pathExists(ignoreFilePath)) {
      await fs.writeFile(ignoreFilePath, defaultAiCodeSyncIgnoreContent);
    }
    
    console.log(chalk.green('✅ AICodeSync initialized successfully!'));
    console.log(chalk.blue('📁 Created:'));
    console.log(chalk.cyan('  - ./ai-code-sync.json'));
    console.log(chalk.cyan('  - ./.ai-code-sync/fusion/'));
    console.log(chalk.cyan('  - ./.ai-code-sync/applydiff/'));
    console.log(chalk.cyan('  - ./.ai-code-sync/applydiff/project_files_diff.txt.example'));
    console.log(chalk.cyan('  - ./.aicodesyncignore'));
    
    console.log(chalk.blue('\n📝 Next steps:'));
    console.log(chalk.cyan('  1. Review ai-code-sync.json and adjust as needed'));
    console.log(chalk.cyan('  2. Run fusion: ai-code-sync fusion'));
  } catch (error) {
    console.error(chalk.red(`❌ Initialization failed: ${error}`));
    process.exit(1);
  }
}