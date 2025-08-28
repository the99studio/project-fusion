// SPDX-License-Identifier: MIT
// Copyright (c) 2025 the99studio
/**
 * Programmatic API for Project Fusion
 * Allows external packages to use fusion functionality without config files
 */
import path from 'node:path';
import type { FileSystemAdapter } from './adapters/file-system.js';
import { processFusion } from './fusion.js';
import type { Config, FilePath, FusionOptions, FusionResult } from './types.js';
import { defaultConfig } from './utils.js';

/**
 * Progress information for VS Code extension
 */
export interface FusionProgress {
    /** Current step being processed */
    step: 'scanning' | 'processing' | 'generating' | 'writing';
    /** Current file being processed (if applicable) */
    currentFile?: string | undefined;
    /** Number of files processed so far */
    filesProcessed: number;
    /** Total number of files to process */
    totalFiles: number;
    /** Progress percentage (0-100) */
    percentage: number;
    /** Human-readable message */
    message: string;
    /** Estimated time remaining in seconds (if calculable) */
    etaSeconds?: number;
    /** Total MB processed so far */
    mbProcessed?: number;
    /** Processing speed in MB/s */
    throughputMBps?: number;
}

/**
 * Cancellation token for VS Code extension
 */
export interface CancellationToken {
    /** Whether cancellation has been requested */
    isCancellationRequested: boolean;
    /** Event that fires when cancellation is requested */
    onCancellationRequested?: (listener: () => void) => void;
}

/**
 * Options for programmatic fusion
 */
export interface ProgrammaticFusionOptions extends Partial<Config> {
    /** Working directory (defaults to process.cwd()) */
    cwd?: string;
    /** Extension groups to include */
    extensionGroups?: readonly string[];
    /** Output directory override */
    outputDirectory?: string;
    /** Root directory override */
    rootDirectory?: string;
    /** FileSystem adapter to use */
    fs?: FileSystemAdapter;
    /** Callback fired when fusion completes (success or failure) */
    onDidFinish?: (result: ProgrammaticFusionResult) => void;
    /** Callback fired during processing to report progress */
    onProgress?: (progress: FusionProgress) => void;
    /** Cancellation token to abort the operation */
    cancellationToken?: CancellationToken;
}

/**
 * Result from programmatic fusion
 */
export interface ProgrammaticFusionResult {
    /** Error object (if failed) */
    error?: Error | string | undefined;
    /** Number of files processed (if successful) */
    filesProcessed?: number;
    /** Path to the fusion file (if successful) */
    fusionFilePath?: FilePath;
    /** Path to the log file */
    logFilePath?: FilePath;
    /** Status message */
    message: string;
    /** Whether the fusion was successful */
    success: boolean;
}

/**
 * Merge partial config with defaults
 * @param partialConfig Partial configuration to merge
 * @param cwd Current working directory
 * @returns Complete configuration
 */
function mergeWithDefaults(partialConfig: Partial<Config>, cwd: string): Config {
    const rootDirectory = partialConfig.rootDirectory ?? cwd;
    
    return {
        allowedExternalPluginPaths: partialConfig.allowedExternalPluginPaths ?? defaultConfig.allowedExternalPluginPaths,
        allowSymlinks: partialConfig.allowSymlinks ?? defaultConfig.allowSymlinks,
        copyToClipboard: partialConfig.copyToClipboard ?? defaultConfig.copyToClipboard,
        excludeSecrets: partialConfig.excludeSecrets ?? defaultConfig.excludeSecrets,
        generatedFileName: partialConfig.generatedFileName ?? defaultConfig.generatedFileName,
        generateHtml: partialConfig.generateHtml ?? defaultConfig.generateHtml,
        generateMarkdown: partialConfig.generateMarkdown ?? defaultConfig.generateMarkdown,
        generateText: partialConfig.generateText ?? defaultConfig.generateText,
        ignorePatterns: partialConfig.ignorePatterns ?? defaultConfig.ignorePatterns,
        maxBase64BlockKB: partialConfig.maxBase64BlockKB ?? defaultConfig.maxBase64BlockKB,
        maxFileSizeKB: partialConfig.maxFileSizeKB ?? defaultConfig.maxFileSizeKB,
        maxFiles: partialConfig.maxFiles ?? defaultConfig.maxFiles,
        maxLineLength: partialConfig.maxLineLength ?? defaultConfig.maxLineLength,
        maxSymlinkAuditEntries: partialConfig.maxSymlinkAuditEntries ?? defaultConfig.maxSymlinkAuditEntries,
        maxTokenLength: partialConfig.maxTokenLength ?? defaultConfig.maxTokenLength,
        maxTotalSizeMB: partialConfig.maxTotalSizeMB ?? defaultConfig.maxTotalSizeMB,
        maxOutputSizeMB: partialConfig.maxOutputSizeMB ?? defaultConfig.maxOutputSizeMB,
        outputDirectory: partialConfig.outputDirectory,
        overwriteFiles: partialConfig.overwriteFiles ?? defaultConfig.overwriteFiles,
        parsedFileExtensions: partialConfig.parsedFileExtensions ?? defaultConfig.parsedFileExtensions,
        parseSubDirectories: partialConfig.parseSubDirectories ?? defaultConfig.parseSubDirectories,
        rootDirectory,
        schemaVersion: 1,
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
 * import { fusionAPI } from '@the99studio/project-fusion';
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
 * ```
 */
export async function fusionAPI(options: ProgrammaticFusionOptions = {}): Promise<ProgrammaticFusionResult> {
    const cwd = options.cwd ?? process.cwd();
    
    // Extract fusion options and callbacks
    const { 
        extensionGroups,
        rootDirectory,
        outputDirectory,
        onDidFinish,
        onProgress,
        cancellationToken,
        fs,
        ...configOptions 
    } = options;
    
    // Build complete configuration
    const config = mergeWithDefaults(configOptions, cwd);
    
    // Override rootDirectory if provided in fusion options
    if (rootDirectory) {
        config.rootDirectory = path.resolve(cwd, rootDirectory);
    }
    
    // Override outputDirectory if provided in fusion options
    if (outputDirectory) {
        config.outputDirectory = path.resolve(cwd, outputDirectory);
    }
    
    // Create enhanced fusion options with callbacks
    const fusionOptions: FusionOptions & {
        onProgress?: (progress: FusionProgress) => void;
        cancellationToken?: CancellationToken;
    } = {
        ...(extensionGroups ? { extensionGroups } : {}),
        ...(onProgress ? { onProgress } : {}),
        ...(cancellationToken ? { cancellationToken } : {}),
        ...(fs ? { fs } : {})
    };
    
    try {
        // Check for cancellation before starting
        if (cancellationToken?.isCancellationRequested) {
            const cancelledResult: ProgrammaticFusionResult = {
                message: 'Operation was cancelled',
                success: false,
                error: 'Cancelled'
            };
            onDidFinish?.(cancelledResult);
            return cancelledResult;
        }
        
        const result = await processFusion(config, fusionOptions);
        
        // Convert FusionResult to ProgrammaticFusionResult
        let finalResult: ProgrammaticFusionResult;
        if (result.success) {
            finalResult = {
                fusionFilePath: result.fusionFilePath,
                logFilePath: result.logFilePath,
                message: result.message,
                success: true
            };
        } else {
            finalResult = {
                message: result.message,
                success: false
            };
            if (result.logFilePath) {
                finalResult.logFilePath = result.logFilePath;
            }
            if (result.error) {
                finalResult.error = result.error;
            }
        }
        
        // Call onDidFinish callback if provided
        onDidFinish?.(finalResult);
        
        return finalResult;
    } catch (error) {
        const errorResult: ProgrammaticFusionResult = {
            message: error instanceof Error ? error.message : 'Unknown error occurred',
            success: false,
            error: error instanceof Error ? error : new Error(String(error))
        };
        
        // Call onDidFinish callback even for exceptions
        onDidFinish?.(errorResult);
        
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
 * import { createConfig, processFusion } from '@the99studio/project-fusion';
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
 * import { runFusion } from '@the99studio/project-fusion';
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
        : mergeWithDefaults(config, config.rootDirectory ?? process.cwd());
    
    return await processFusion(fullConfig, options);
}