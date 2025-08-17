/**
 * Type definitions for the fusion functionality
 */

// Branded type for type-safe file path handling
export type FilePath = string & { readonly __brand: unique symbol };

export const createFilePath = (path: string): FilePath => path as FilePath;

/**
 * Main configuration interface
 */
export interface Config {
    copyToClipboard: boolean;
    generatedFileName: string;
    generateHtml: boolean;
    generateMarkdown: boolean;
    generatePdf: boolean;
    generateText: boolean;
    ignorePatterns: string[];
    parsedFileExtensions: {
        backend?: string[];
        config?: string[];
        cpp?: string[];
        doc?: string[];
        godot?: string[];
        scripts?: string[];
        web?: string[];
        [key: string]: string[] | undefined;
    };
    parsing: {
        maxFileSizeKB: number;
        parseSubDirectories: boolean;
        rootDirectory: string;
    };
    schemaVersion: number;
    useGitIgnoreForExcludes: boolean;
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
 * Type-safe fusion result with discriminated union for success/failure states
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