#!/usr/bin/env node
// SPDX-License-Identifier: MIT
// Copyright (c) 2025 the99studio
/**
 * Command-line interface for Project Fusion
 */
import { Command } from 'commander';
import pkg from '../package.json' with { type: 'json' };
import {
    runConfigCheckCommand,
    runFusionCommand,
    runInitCommand
} from './clicommands.js';

const program = new Command();

program
    .name('project-fusion')
    .description('Project Fusion - Efficient project file management and sharing')
    .version(pkg.version, '-v, --version');

// Default command (fusion) - runs when no subcommand is specified
program
    .option('--extensions <groups>', 'Comma-separated list of extension groups (e.g., backend,web)')
    .option('--root <directory>', 'Root directory to start scanning from (defaults to current directory)')
    .action((options) => {
        // Default action is to run fusion
        void runFusionCommand(options);
    });

// Explicit fusion command with same options
program
    .command('fusion')
    .description('Run fusion process to merge project files')
    .option('--extensions <groups>', 'Comma-separated list of extension groups (e.g., backend,web)')
    .option('--root <directory>', 'Root directory to start scanning from (defaults to current directory)')
    .action((options, command) => {
        // Get options from the command itself first, then fallback to parent
        const cmdOptions = command.opts();
        const parentOptions = command.parent.opts();
        // Merge options, preferring command options over parent options
        const mergedOptions = { ...parentOptions, ...cmdOptions };
        void runFusionCommand(mergedOptions);
    });

// Init command
program
    .command('init')
    .description('Initialize Project Fusion in the current directory')
    .option('--force', 'Force initialization even if configuration already exists')
    .action((options) => {
        void runInitCommand(options);
    });

// Config check command
program
    .command('config-check')
    .description('Validate project-fusion.json and display active groups/extensions')
    .action(() => {
        void runConfigCheckCommand();
    });

// Parse arguments with Commander.js
program.parse(process.argv);