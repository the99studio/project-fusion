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

// Run fusion by default if no command specified
if (process.argv.length < 3 || (!process.argv.includes('init') && !process.argv.includes('--help') && !process.argv.includes('-h') && !process.argv.includes('--version') && !process.argv.includes('-v'))) {
    // If no arguments or only options, run fusion
    const args = process.argv.slice(2);
    if (args.length === 0 || args.every(arg => arg.startsWith('--'))) {
        const options: any = {};
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
        runFusionCommand(options);
        process.exit(0);
    }
}

// Parse command line arguments
program.parse(process.argv);