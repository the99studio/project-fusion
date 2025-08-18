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

// Utility types for enhanced type safety
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

// Extension groups with type safety (alphabetically sorted)
export const EXTENSION_GROUPS = {
    web: ['.css', '.html', '.js', '.jsx', '.svelte', '.ts', '.tsx', '.vue'],
    backend: ['.cs', '.go', '.java', '.php', '.py', '.rb', '.rs'],
    config: ['.cfg', '.json', '.toml', '.xml', '.yaml', '.yml'],
    cpp: ['.c', '.cc', '.cpp', '.h', '.hpp'],
    scripts: ['.bat', '.cmd', '.ps1', '.sh'],
    godot: ['.gd', '.import', '.tres', '.tscn'],
    doc: ['.adoc', '.md', '.rst']
} as const;

export type ExtensionGroupName = keyof typeof EXTENSION_GROUPS;
export type ExtensionGroup = typeof EXTENSION_GROUPS[ExtensionGroupName];

export const isValidExtensionGroup = (group: string): group is ExtensionGroupName => {
    return group in EXTENSION_GROUPS;
};

export const getExtensionsForGroup = (groupName: ExtensionGroupName): ExtensionGroup => {
    return EXTENSION_GROUPS[groupName];
};

// Enhanced error hierarchy with codes and severity
export type FusionErrorCode = 
    | 'INVALID_PATH'
    | 'UNKNOWN_EXTENSION_GROUP'
    | 'EMPTY_ARRAY'
    | 'PATH_TRAVERSAL'
    | 'SYMLINK_NOT_ALLOWED';

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
    allowSymlinks: boolean;
    copyToClipboard: boolean;
    generatedFileName: string;
    generateHtml: boolean;
    generateMarkdown: boolean;
    generateText: boolean;
    ignorePatterns: string[];
    maxFileSizeKB: number;
    maxFiles: number;
    maxTotalSizeMB: number;
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
    parseSubDirectories: boolean;
    rootDirectory: string;
    schemaVersion: number;
    useGitIgnoreForExcludes: boolean;
}


/**
 * Options for the fusion process
 */
export interface FusionOptions {
    extensionGroups?: string[];
    pluginsDir?: string;
    enabledPlugins?: string[];
    fs?: import('./adapters/file-system.js').FileSystemAdapter;
}

/**
 * Type-safe fusion result with discriminated union for success/failure states
 */
export type FusionResult = 
    | {
        fusionFilePath: FilePath;
        logFilePath: FilePath;
        message: string;
        success: true;
    }
    | {
        error?: Error | string;
        code?: string;
        details?: any;
        logFilePath?: FilePath;
        message: string;
        success: false;
    };