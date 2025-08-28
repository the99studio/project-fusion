// SPDX-License-Identifier: MIT
// Copyright (c) 2025 the99studio
/**
 * Type definitions for the fusion functionality
 */
import type { FileSystemAdapter } from './adapters/file-system.js';

export type FilePath = string & { readonly __brand: unique symbol };

export const createFilePath = (path: string): FilePath => {
    if (!path || typeof path !== 'string') {
        throw new FusionError('Invalid file path provided', 'INVALID_PATH', 'error');
    }
    return path as FilePath;
};

export type NonEmptyArray<T> = readonly [T, ...T[]];

export const isNonEmptyArray = <T>(array: readonly T[]): array is NonEmptyArray<T> => {
    return array.length > 0;
};

export const createNonEmptyArray = <T>(items: readonly T[]): NonEmptyArray<T> => {
    if (!isNonEmptyArray(items)) {
        throw new FusionError('Array must contain at least one element', 'EMPTY_ARRAY', 'error');
    }
    return items;
};

export const EXTENSION_GROUPS = {
    backend: ['.cs', '.go', '.java', '.php', '.py', '.rb', '.rs'],
    config: ['.cfg', '.json', '.toml', '.xml', '.yaml', '.yml'],
    cpp: ['.c', '.cc', '.cpp', '.h', '.hpp'],
    doc: ['.adoc', '.md', '.rst'],
    godot: ['.gd', '.import', '.tres', '.tscn'],
    scripts: ['.bat', '.cmd', '.ps1', '.sh'],
    web: ['.css', '.html', '.js', '.jsx', '.svelte', '.ts', '.tsx', '.vue']
} as const;

export type ExtensionGroupName = keyof typeof EXTENSION_GROUPS;
export type ExtensionGroup = typeof EXTENSION_GROUPS[ExtensionGroupName];

export const isValidExtensionGroup = (group: string): group is ExtensionGroupName => {
    return group in EXTENSION_GROUPS;
};

export const getExtensionsForGroup = (groupName: ExtensionGroupName): ExtensionGroup => {
    return EXTENSION_GROUPS[groupName];
};

export type FusionErrorCode = 
    | 'EMPTY_ARRAY'
    | 'INVALID_PATH'
    | 'PATH_TRAVERSAL'
    | 'PLUGIN_NOT_ALLOWED'
    | 'SYMLINK_NOT_ALLOWED'
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
 * Main configuration interface (properties in alphabetical order)
 */
export interface Config {
    /** Explicit list of allowed external plugin paths for security */
    allowedExternalPluginPaths?: string[];
    allowSymlinks: boolean;
    copyToClipboard: boolean;
    /** Whether to exclude files containing secrets (default: true) */
    excludeSecrets: boolean;
    generatedFileName: string;
    generateHtml: boolean;
    generateMarkdown: boolean;
    generateText: boolean;
    ignorePatterns: readonly string[];
    /** Maximum size for base64 blocks in KB before warning/rejection */
    maxBase64BlockKB: number;
    maxFileSizeKB: number;
    maxFiles: number;
    /** Maximum line length in characters before warning/rejection */
    maxLineLength: number;
    /** Maximum number of symlink audit entries to log */
    maxSymlinkAuditEntries: number;
    /** Maximum token length (for detecting minified content) */
    maxTokenLength: number;
    maxTotalSizeMB: number;
    maxOutputSizeMB: number;
    outputDirectory?: string | undefined;
    overwriteFiles: boolean;
    parsedFileExtensions: {
        backend?: readonly string[];
        config?: readonly string[];
        cpp?: readonly string[];
        doc?: readonly string[];
        godot?: readonly string[];
        scripts?: readonly string[];
        web?: readonly string[];
        [key: string]: readonly string[] | undefined;
    };
    parseSubDirectories: boolean;
    rootDirectory: string;
    schemaVersion: number;
    useGitIgnoreForExcludes: boolean;
}


/**
 * Options for the fusion process
 */
export interface FusionOptions {
    enabledPlugins?: readonly string[];
    extensionGroups?: readonly string[];
    fs?: FileSystemAdapter;
    pluginsDir?: string;
    previewMode?: boolean;
}

/**
 * Type-safe fusion result with discriminated union for success/failure states
 */
export type FusionResult = 
    | {
        filesProcessed: number;
        fusionFilePath: FilePath;
        logFilePath: FilePath;
        message: string;
        success: true;
    }
    | {
        code?: string;
        details?: unknown;
        error?: Error | string;
        filesProcessed?: number;
        logFilePath?: FilePath;
        message: string;
        success: false;
    };