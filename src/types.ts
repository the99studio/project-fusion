// SPDX-License-Identifier: MIT
// Copyright (c) 2025 the99studio
/**
 * Type definitions for the fusion functionality
 */

// Branded types for type-safe handling
export type FilePath = string & { readonly __brand: unique symbol };

export const createFilePath = (path: string): FilePath => {
    if (!path || typeof path !== 'string') {
        throw new FusionError('Invalid file path provided', 'INVALID_PATH', 'error');
    }
    return path as FilePath;
};

// Enhanced error hierarchy with codes and severity
export type FusionErrorCode = 
    | 'INVALID_PATH'
    | 'UNKNOWN_EXTENSION_GROUP';

export type FusionErrorSeverity = 'error' | 'warning' | 'info';

export class FusionError extends Error {
    public readonly code: FusionErrorCode;
    public readonly severity: FusionErrorSeverity;
    public readonly context: Record<string, unknown> | undefined;

    constructor(
        message: string, 
        code: FusionErrorCode, 
        severity: FusionErrorSeverity = 'error',
        context?: Record<string, unknown>
    ) {
        super(message);
        this.name = 'FusionError';
        this.code = code;
        this.severity = severity;
        this.context = context;
    }
}

/**
 * Main configuration interface
 */
export interface Config {
    copyToClipboard: boolean;
    generatedFileName: string;
    generateHtml: boolean;
    generateMarkdown: boolean;
    generateText: boolean;
    ignorePatterns: string[];
    maxFileSizeKB: number;
    parseSubDirectories: boolean;
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
    rootDirectory: string;
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