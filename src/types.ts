/**
 * Type definitions for the fusion functionality
 */

// Branded types for better type safety
export type FilePath = string & { readonly __brand: unique symbol };
export type FileHash = string & { readonly __brand: unique symbol };
export type FileExtension = `.${string}`;

// Helper functions for branded types
export const createFilePath = (path: string): FilePath => path as FilePath;
export const createFileHash = (hash: string): FileHash => hash as FileHash;

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
    hash: FileHash;
}

/**
 * Options for the fusion process
 */
export interface FusionOptions {
    extensionGroups?: string[];
}

/**
 * Result of the fusion process - Using discriminated union for better type safety
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