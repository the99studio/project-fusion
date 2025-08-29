#!/usr/bin/env node
// SPDX-License-Identifier: MIT
// Copyright (c) 2025 the99studio
/**
 * Command-line interface for Project Fusion
 */
import { Command } from 'commander';
import {
    runConfigCheckCommand,
    runFusionCommand,
    runInitCommand
} from './clicommands.js';
import { getVersionSync } from './version.js';

const program = new Command();

program
    .name('project-fusion')
    .description('Project Fusion - Efficient project file management and sharing')
    .version(getVersionSync(), '-v, --version')
    .allowUnknownOption(false)
    .showHelpAfterError(true);

// Default command (fusion) - runs when no subcommand is specified
program
    .option('--extensions <groups>', 'Comma-separated list of extension groups (e.g., backend,web)')
    .option('--root <directory>', 'Root directory to start scanning from (defaults to current directory)')
    .option('--aggressive-sanitization', 'Enable aggressive content sanitization for highly sensitive environments')
    .option('--allow-symlinks', 'Allow processing symbolic links (SECURITY WARNING: use with caution)')
    .option('--allowed-plugin-paths <paths>', 'Comma-separated list of allowed external plugin paths')
    .option('--plugins-dir <directory>', 'Directory containing plugins to load')
    .option('--plugins <names>', 'Comma-separated list of plugin names to enable')
    // Output format flags
    .option('--html', 'Generate HTML output (overrides config)')
    .option('--md', 'Generate Markdown output (overrides config)')
    .option('--txt', 'Generate text output (overrides config)')
    // Naming flags
    .option('--name <filename>', 'Custom filename for generated files (without extension)')
    .option('--out <directory>', 'Output directory for generated files')
    // Control flags
    .option('--no-clipboard', 'Disable clipboard copying')
    .option('--groups <csv>', 'Comma-separated extension groups (same as --extensions)')
    // Size limits
    .option('--max-file-size <kb>', 'Maximum file size in KB (default: 1024)')
    .option('--max-files <count>', 'Maximum number of files to process (default: 10000)')
    .option('--max-total-size <mb>', 'Maximum total size in MB (default: 100)')
    .option('--max-base64-kb <size>', 'Maximum base64 block size in KB (default: 2)')
    .option('--max-line-length <chars>', 'Maximum line length in characters (default: 5000)')
    .option('--max-token-length <chars>', 'Maximum token length for minified detection (default: 2000)')
    // Parsing behavior
    .option('--no-subdirs', 'Disable parsing subdirectories')
    .option('--no-gitignore', 'Disable using .gitignore for exclusions')
    .option('--no-exclude-secrets', 'Disable automatic secret exclusion')
    .option('--ignore <patterns>', 'Additional comma-separated ignore patterns')
    // Preview mode
    .option('--preview', 'Preview mode: list files without generating output')
    // File overwrite protection
    .option('--overwrite', 'Overwrite existing output files without prompting')
    .action((options: { 
        extensions?: string; 
        root?: string; 
        aggressiveSanitization?: boolean;
        allowSymlinks?: boolean;
        pluginsDir?: string;
        plugins?: string;
        html?: boolean;
        md?: boolean;
        txt?: boolean;
        name?: string;
        out?: string;
        clipboard?: boolean;
        groups?: string;
        maxFileSize?: string;
        maxFiles?: string;
        maxTotalSize?: string;
        maxBase64Kb?: string;
        maxLineLength?: string;
        maxTokenLength?: string;
        allowedPluginPaths?: string;
        subdirs?: boolean;
        gitignore?: boolean;
        excludeSecrets?: boolean;
        ignore?: string;
        preview?: boolean;
        overwrite?: boolean;
    }) => {
        // Default action is to run fusion
        void runFusionCommand(options);
    });


// Init command
program
    .command('init')
    .description('Initialize Project Fusion in the current directory')
    .option('--force', 'Force initialization even if configuration already exists')
    .action((options: { force?: boolean }) => {
        void runInitCommand(options);
    });

// Config check command
program
    .command('config-check')
    .description('Validate project-fusion.json and display active groups/extensions')
    .action(() => {
        void runConfigCheckCommand();
    });

program.parse(process.argv);