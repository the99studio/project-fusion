#!/usr/bin/env node
/**
 * Command-line interface for Project Fusion
 */
import { Command } from 'commander';
import chalk from 'chalk';
import { 
  runFusionCommand, 
  runInitCommand 
} from './clicommands.js';

const program = new Command();

// Set version and description
program
  .name('project-fusion')
  .description('Project Fusion - Efficient project file management and sharing')
  .version('0.0.1', '-v, --version');

// Fusion command
program
  .command('fusion')
  .description('Merge project files into a single file for easy sharing')
  .option('--extensions <groups>', 'Comma-separated list of extension groups (e.g., backend,web)')
  .option('--root <directory>', 'Root directory to start scanning from (defaults to current directory)')
  .action((options) => {
    runFusionCommand(options);
  });

// Init command
program
  .command('init')
  .description('Initialize Project Fusion in the current directory')
  .option('--force', 'Force initialization even if configuration already exists')
  .action((options) => {
    runInitCommand(options);
  });

// Display help if no args provided
if (process.argv.length < 3) {
  program.outputHelp();
}

// Parse command line arguments
program.parse(process.argv);