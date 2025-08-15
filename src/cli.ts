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
    const options: any = {};
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