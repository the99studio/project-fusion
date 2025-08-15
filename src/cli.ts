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