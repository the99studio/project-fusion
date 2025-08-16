/**
 * Type definitions for the fusion functionality
 */

// Branded type for file paths to prevent string mixing
export type FilePath = string & { readonly __brand: unique symbol };

export const createFilePath = (path: string): FilePath => path as FilePath;

/**
 * Main configuration interface
 */
export interface Config {
    fusion: {
        fusion_file: string;
        fusion_log: string;
        copyToClipboard: boolean;
    };
    parsedFileExtensions: {
        backend: string[];
        config: string[];
        cpp: string[];
        scripts: string[];
        web: string[];
        godot: string[];
        [key: string]: string[];
    };
    parsing: {
        parseSubDirectories: boolean;
        rootDirectory: string;
        maxFileSizeKB?: number;
    };
    ignorePatterns: string[];
    useGitIgnoreForExcludes: boolean;
    schemaVersion: number;
}

/**
 * Information about a file for fusion
 */
export interface FileInfo {
    path: FilePath;
    content: string;
}

/**
 * Options for the fusion process
 */
export interface FusionOptions {
    extensionGroups?: string[];
}

/**
 * Discriminated union for fusion results - ensures type safety with success/failure states
 */
export type FusionResult = 
    | {
        success: true;
        message: string;
        fusionFilePath: FilePath;
        logFilePath: FilePath;
    }
    | {
        success: false;
        message: string;
        logFilePath?: FilePath;
        error?: Error;
    };