// SPDX-License-Identifier: MIT
// Copyright (c) 2025 the99studio
/**
 * Programmatic API for Project Fusion
 * Allows external packages to use fusion functionality without config files
 */
import path from 'node:path';
import { processFusion } from './fusion.js';
import { defaultConfig } from './utils.js';
import type { Config, FilePath, FusionOptions, FusionResult } from './types.js';

/**
 * Options for programmatic fusion
 */
export interface ProgrammaticFusionOptions extends Partial<Config> {
    /** Working directory (defaults to process.cwd()) */
    cwd?: string;
    /** Skip file creation and return content only */
    inMemoryOnly?: boolean;
    /** Extension groups to include */
    extensionGroups?: string[];
    /** Root directory override */
    rootDir?: string;
}

/**
 * Result from programmatic fusion including file contents
 */
export interface ProgrammaticFusionResult {
    /** Whether the fusion was successful */
    success: boolean;
    /** Status message */
    message: string;
    /** Number of files processed (if successful) */
    filesProcessed?: number;
    /** Path to the fusion file (if successful) */
    fusionFilePath?: FilePath;
    /** Path to the log file */
    logFilePath?: FilePath;
    /** Error object (if failed) */
    error?: Error | undefined;
    /** Generated file contents when inMemoryOnly is true */
    contents?: {
        text?: string;
        markdown?: string;
        html?: string;
    };
}

/**
 * Merge partial config with defaults
 * @param partialConfig Partial configuration to merge
 * @param cwd Current working directory
 * @returns Complete configuration
 */
function mergeWithDefaults(partialConfig: Partial<Config>, cwd: string): Config {
    const rootDirectory = partialConfig.rootDirectory || cwd;
    
    return {
        schemaVersion: 1,
        copyToClipboard: partialConfig.copyToClipboard ?? defaultConfig.copyToClipboard,
        generatedFileName: partialConfig.generatedFileName ?? defaultConfig.generatedFileName,
        generateHtml: partialConfig.generateHtml ?? defaultConfig.generateHtml,
        generateMarkdown: partialConfig.generateMarkdown ?? defaultConfig.generateMarkdown,
        generateText: partialConfig.generateText ?? defaultConfig.generateText,
        ignorePatterns: partialConfig.ignorePatterns ?? defaultConfig.ignorePatterns,
        maxFileSizeKB: partialConfig.maxFileSizeKB ?? defaultConfig.maxFileSizeKB,
        parsedFileExtensions: partialConfig.parsedFileExtensions ?? defaultConfig.parsedFileExtensions,
        parseSubDirectories: partialConfig.parseSubDirectories ?? defaultConfig.parseSubDirectories,
        rootDirectory,
        useGitIgnoreForExcludes: partialConfig.useGitIgnoreForExcludes ?? defaultConfig.useGitIgnoreForExcludes
    };
}

/**
 * Process fusion programmatically without requiring a config file
 * @param options Options for fusion including partial config
 * @returns Fusion result with optional file contents
 * 
 * @example
 * ```typescript
 * import { fusionAPI } from 'project-fusion';
 * 
 * // Use with custom configuration
 * const result = await fusionAPI({
 *     rootDirectory: '/path/to/project',
 *     generateHtml: false,
 *     parsedFileExtensions: {
 *         web: ['.ts', '.tsx'],
 *         backend: ['.py']
 *     },
 *     ignorePatterns: ['tests/', '*.spec.ts']
 * });
 * 
 * // Use in-memory only (no files created)
 * const result = await fusionAPI({
 *     inMemoryOnly: true,
 *     generateMarkdown: true,
 *     generateHtml: false,
 *     generateText: false
 * });
 * console.log(result.contents?.markdown);
 * ```
 */
export async function fusionAPI(options: ProgrammaticFusionOptions = {}): Promise<ProgrammaticFusionResult> {
    const cwd = options.cwd || process.cwd();
    
    // Extract fusion options
    const { 
        cwd: _cwd,
        inMemoryOnly,
        extensionGroups,
        rootDir,
        ...configOptions 
    } = options;
    
    // Build complete configuration
    const config = mergeWithDefaults(configOptions, cwd);
    
    // Override rootDirectory if rootDir is provided in fusion options
    if (rootDir) {
        config.rootDirectory = path.resolve(cwd, rootDir);
    }
    
    // If in-memory only, we'll need to intercept the file writing
    // For now, we'll use the standard process and add a TODO for future enhancement
    if (inMemoryOnly) {
        // TODO: Implement in-memory processing to avoid file I/O
        // This would require refactoring fusion.ts to support returning content
        // without writing to disk
        console.warn('inMemoryOnly option not yet implemented, files will still be created');
    }
    
    // Process fusion with the merged configuration
    const fusionOptions: FusionOptions = extensionGroups 
        ? { extensionGroups }
        : {};
    
    const result = await processFusion(config, fusionOptions);
    
    // Convert FusionResult to ProgrammaticFusionResult
    if (result.success) {
        return {
            success: true,
            message: result.message,
            fusionFilePath: result.fusionFilePath,
            logFilePath: result.logFilePath,
            // TODO: Add filesProcessed when available from fusion.ts
        };
    } else {
        const errorResult: ProgrammaticFusionResult = {
            success: false,
            message: result.message
        };
        if (result.logFilePath) {
            errorResult.logFilePath = result.logFilePath;
        }
        if (result.error) {
            errorResult.error = result.error;
        }
        return errorResult;
    }
}

/**
 * Create a custom configuration object for programmatic use
 * @param overrides Configuration overrides
 * @returns Complete configuration object
 * 
 * @example
 * ```typescript
 * import { createConfig, processFusion } from 'project-fusion';
 * 
 * const config = createConfig({
 *     generateHtml: false,
 *     maxFileSizeKB: 2048
 * });
 * 
 * const result = await processFusion(config);
 * ```
 */
export function createConfig(overrides: Partial<Config> = {}): Config {
    return mergeWithDefaults(overrides, process.cwd());
}

/**
 * Programmatically run fusion with a specific configuration
 * Useful for VS Code extensions and other integrations
 * 
 * @param config Complete or partial configuration
 * @param options Additional fusion options
 * @returns Fusion result
 * 
 * @example
 * ```typescript
 * import { runFusion } from 'project-fusion';
 * 
 * // With partial config (uses defaults for missing values)
 * const result = await runFusion({
 *     rootDirectory: '/my/project',
 *     generateHtml: false
 * });
 * 
 * // With extension group filter
 * const result = await runFusion(
 *     { rootDirectory: '/my/project' },
 *     { extensionGroups: ['web', 'backend'] }
 * );
 * ```
 */
export async function runFusion(
    config: Partial<Config> | Config,
    options: FusionOptions = {}
): Promise<FusionResult> {
    // Check if config has all required fields
    const isCompleteConfig = (
        'schemaVersion' in config &&
        'rootDirectory' in config &&
        'parsedFileExtensions' in config
    );
    
    const fullConfig = isCompleteConfig 
        ? config as Config
        : mergeWithDefaults(config, config.rootDirectory || process.cwd());
    
    return await processFusion(fullConfig, options);
}