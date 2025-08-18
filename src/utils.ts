// SPDX-License-Identifier: MIT
// Copyright (c) 2025 the99studio
/**
 * Utilities for Project Fusion
 */
import path from 'node:path';
import process from 'node:process';

import fs from 'fs-extra';
import { z } from 'zod';

import { ConfigSchemaV1 } from './schema.js';
import { type Config, FusionError, isNonEmptyArray, isValidExtensionGroup } from './types.js';


/**
 * Default configuration for Project Fusion
 */
export const defaultConfig = {
    allowSymlinks: false,
    copyToClipboard: false,
    generatedFileName: "project-fusioned",
    generateHtml: true,
    generateMarkdown: true,
    generateText: true,
    maxFileSizeKB: 1024,
    maxFiles: 10000,
    maxTotalSizeMB: 100,
    parseSubDirectories: true,
    parsedFileExtensions: {
        backend: [".cs", ".go", ".java", ".php", ".py", ".rb", ".rs"] as const,
        config: [".json", ".toml", ".xml", ".yaml", ".yml"] as const,
        cpp: [".c", ".cc", ".cpp", ".h", ".hpp"] as const,
        doc: [".adoc", ".md", ".rst"] as const,
        godot: [".cfg", ".cs", ".gd", ".import", ".tres", ".tscn"] as const,
        scripts: [".bat", ".cmd", ".ps1", ".sh"] as const,
        web: [".css", ".html", ".js", ".jsx", ".svelte", ".ts", ".tsx", ".vue"] as const
    },
    ignorePatterns: [
        "project-fusion.json",
        "project-fusion.log",
        "project-fusioned.*",
        "node_modules/",
        "package-lock.json",
        "pnpm-lock.yaml",
        "yarn.lock",
        "dist/",
        "build/",
        "*.min.js",
        "*.min.css",
        ".env",
        ".env.*",
        "*.key",
        "*.pem",
        "**/credentials/*",
        "**/secrets/*",
        "*.log",
        "logs/",
        ".DS_Store",
        "Thumbs.db",
        ".vscode/",
        ".idea/",
        "*.swp",
        "*.swo",
        // Binary files and archives
        "*.zip",
        "*.tar",
        "*.tgz",
        "*.gz",
        "*.7z",
        "*.rar",
        // Images
        "*.png",
        "*.jpg",
        "*.jpeg",
        "*.gif",
        "*.bmp",
        "*.ico",
        "*.svg",
        "*.webp",
        // Documents
        "*.pdf",
        "*.doc",
        "*.docx",
        "*.xls",
        "*.xlsx",
        "*.ppt",
        "*.pptx",
        // Media
        "*.mp3",
        "*.mp4",
        "*.avi",
        "*.mov",
        "*.wmv",
        "*.flv",
        "*.wav",
        "*.flac",
        // Game engine assets
        "*.unitypackage",
        "*.uasset",
        "*.fbx",
        "*.obj",
        "*.blend",
        // Compiled/Binary
        "*.exe",
        "*.dll",
        "*.so",
        "*.dylib",
        "*.a",
        "*.o",
        "*.pyc",
        "*.pyo",
        "*.class",
        "*.jar",
        "*.war"
    ],
    rootDirectory: ".",
    schemaVersion: 1,
    useGitIgnoreForExcludes: true
} as const satisfies Config;


/**
 * Load and validate configuration with fallback to defaults
 * @returns The loaded configuration or default config if invalid/missing
 */
export async function loadConfig(): Promise<Config> {
    try {
        const configPath = path.resolve('./project-fusion.json');
        
        let configContent: string;
        try {
            configContent = await fs.readFile(configPath, 'utf8');
        } catch {
            return defaultConfig;
        }

        const parsedConfig = JSON.parse(configContent) as unknown;

        try {
            const validatedConfig = ConfigSchemaV1.parse(parsedConfig);
            return validatedConfig;
        } catch (zodError: unknown) {
            // Graceful degradation with detailed error reporting
            if (zodError instanceof z.ZodError) {
                console.error('Configuration validation failed (will use default config):');
                for (const [index, issue] of zodError.issues.entries()) {
                    const path = issue.path.length > 0 ? issue.path.join('.') : 'root';
                     
                    const value = issue.path.reduce((obj: unknown, key) => {
                        if (typeof key === 'string' && obj && typeof obj === 'object') {
                            return (obj as Record<string, unknown>)[key];
                        }
                        return undefined;
                    }, parsedConfig);
                    console.error(`  ${index + 1}. Path: ${path}`);
                    console.error(`     Error: ${issue.message}`);
                    console.error(`     Current value: ${JSON.stringify(value)}`);
                    if (issue.code === 'invalid_type') {
                         
                        console.error(`     Expected type: ${String((issue as unknown as Record<string, unknown>)['expected'])}, received: ${String((issue as unknown as Record<string, unknown>)['received'])}`);
                    }
                }
            } else {
                console.error('Unknown validation error (will use default config):', zodError);
            }
            return defaultConfig;
        }
    } catch (error) {
        const typedError = error instanceof Error ? error : new Error(String(error));

        console.error('Error loading configuration, will use default configuration:', {
            message: typedError.message,
            stack: typedError.stack,
            context: 'loadConfig',
            configPath: path.resolve('./project-fusion.json')
        });

        return defaultConfig;
    }
}

/**
 * Create directory if it doesn't exist
 * @param directory Directory path
 */
export async function ensureDirectoryExists(directory: string): Promise<void> {
    await fs.ensureDir(directory);
}

/**
 * Write content to log file with optional console output
 * @param logFilePath Path to log file
 * @param content Content to log
 * @param append If true, append to existing file
 * @param consoleOutput If true, also display on console
 */
export async function writeLog(
    logFilePath: string,
    content: string,
    append = false,
    consoleOutput = false
): Promise<void> {
    try {
        await ensureDirectoryExists(path.dirname(logFilePath));
        await (append ? fs.appendFile(logFilePath, `${content  }\n`) : fs.writeFile(logFilePath, `${content  }\n`));

        if (consoleOutput) {
            console.log(content);
        }
    } catch (error) {
        console.error('Error writing log:', error);
    }
}


/**
 * Format a timestamp
 * @param date Optional date to format, defaults to current date
 * @returns Formatted timestamp
 */
export function formatTimestamp(date?: Date): string {
    return (date ?? new Date()).toISOString();
}

/**
 * Generate a helpful message when no files match the criteria
 */
export function generateHelpfulEmptyMessage(extensions: string[], config: Config): string {
    const messages = ['💡 Suggestions to find files:'];
    
    // Suggest different extension groups
    const availableGroups = Object.keys(config.parsedFileExtensions);
    if (availableGroups.length > 0) {
        messages.push(`• Try different extension groups: ${availableGroups.join(', ')}`);
        messages.push(`  Example: project-fusion --extensions ${availableGroups.slice(0, 2).join(',')}`);
    }
    
    // Suggest checking ignore patterns
    if (config.ignorePatterns.length > 0) {
        messages.push(`• Check if files are being ignored by patterns`);
        messages.push(`  Current ignore patterns: ${config.ignorePatterns.slice(0, 3).join(', ')}${config.ignorePatterns.length > 3 ? '...' : ''}`);
    }
    
    // Suggest different directory
    messages.push(`• Check if you're in the right directory: ${config.rootDirectory}`);
    messages.push(`• Use --root <path> to specify a different directory`);
    
    // Suggest disabling gitignore
    if (config.useGitIgnoreForExcludes) {
        messages.push(`• Try without .gitignore filtering (files might be git-ignored)`);
    }
    
    // Show what extensions are being looked for
    if (extensions.length > 0) {
        messages.push(`• Currently looking for files with extensions: ${extensions.join(', ')}`);
    }
    
    // Suggest preview mode if not already in it
    messages.push(`• Use --preview to see what files would be processed`);
    messages.push(`• Use 'project-fusion config-check' to see your current configuration`);
    
    return messages.join('\n');
}

/**
 * Format a local timestamp for display
 * @param date Optional date to format, defaults to current date
 * @returns Formatted local timestamp
 */
export function formatLocalTimestamp(date?: Date): string {
    const now = date ?? new Date();
    return now.toLocaleString('fr-FR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short'
    });
}


/**
 * Extract file extensions from configuration groups
 * @param config Config object
 * @param groups Extension groups to include (all if undefined)
 * @returns Array of file extensions
 */
export function getExtensionsFromGroups(
    config: Config,
    groups?: string[]
): string[] {
    // Return all extensions if no specific groups requested
    if (!groups || groups.length === 0) {
        return Object.values(config.parsedFileExtensions)
            .filter((extensions): extensions is string[] => Boolean(extensions))
            .flat();
    }

    // Validate and collect extensions from specified groups
    return groups.reduce((acc: string[], group: string) => {
        // Type-safe group validation
        if (!isValidExtensionGroup(group)) {
            console.warn(`Unknown extension group '${group}'. Valid groups: ${Object.keys(config.parsedFileExtensions).join(', ')}`);
            return acc;
        }

        const extensions = config.parsedFileExtensions[group];
        if (extensions && isNonEmptyArray(extensions)) {
            acc.push(...extensions);
        } else {
            console.warn(`Extension group '${group}' is empty or not found in configuration`);
        }
        return acc;
    }, []);
}

/**
 * Validate that a file path is safe and doesn't escape the root directory
 * @param filePath Path to validate
 * @param rootDirectory Root directory that files must stay within
 * @returns Normalized absolute path if valid
 * @throws FusionError if path is unsafe
 */
export function validateSecurePath(filePath: string, rootDirectory: string): string {
    try {
        // Resolve both paths to absolute paths
        const resolvedRoot = path.resolve(rootDirectory);
        const resolvedFile = path.resolve(filePath);
        
        // Use path.relative for more robust validation
        const relativePath = path.relative(resolvedRoot, resolvedFile);
        
        // If relative path starts with '..' or is absolute, the file escapes the root
        if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
            throw new FusionError(
                `Path traversal detected: '${filePath}' escapes root directory '${rootDirectory}'`,
                'PATH_TRAVERSAL',
                'error',
                { filePath, rootDirectory, resolvedFile, resolvedRoot, relativePath }
            );
        }
        
        return resolvedFile;
    } catch (error) {
        if (error instanceof FusionError) {
            throw error;
        }
        throw new FusionError(
            `Invalid path: '${filePath}'`,
            'INVALID_PATH',
            'error',
            { filePath, rootDirectory, originalError: error }
        );
    }
}

/**
 * Check if a path is a symbolic link and validate it's allowed
 * @param filePath Path to check
 * @param allowSymlinks Whether symbolic links are allowed
 * @returns True if the path is safe to process
 * @throws FusionError if symlink is found and not allowed
 */
export async function validateNoSymlinks(filePath: string, allowSymlinks: boolean = false): Promise<boolean> {
    try {
        const stats = await fs.lstat(filePath);
        
        if (stats.isSymbolicLink()) {
            if (!allowSymlinks) {
                throw new FusionError(
                    `Symbolic link not allowed: '${filePath}'`,
                    'SYMLINK_NOT_ALLOWED',
                    'error',
                    { filePath }
                );
            }
            // If symlinks are allowed, we still want to log them for transparency
            console.warn(`Processing symbolic link: ${filePath}`);
        }
        
        return true;
    } catch (error) {
        if (error instanceof FusionError) {
            throw error;
        }
        // If lstat fails, the file doesn't exist or is inaccessible
        return false;
    }
}

/**
 * Detect if a file appears to be binary
 * @param filePath Path to the file
 * @param sampleSize Number of bytes to sample (default: 1024)
 * @returns True if the file appears to be binary
 */
export async function isBinaryFile(filePath: string, sampleSize: number = 1024): Promise<boolean> {
    try {
        const stats = await fs.stat(filePath);
        if (stats.size === 0) {
            return false; // Empty file is not binary
        }
        
        // Read only the first part of the file for analysis
        const bytesToRead = Math.min(stats.size, sampleSize);
        const buffer = await fs.readFile(filePath, { encoding: null });
        const actualBytesToCheck = Math.min(buffer.length, bytesToRead);
        
        // Check for null bytes which indicate binary content
        for (let i = 0; i < actualBytesToCheck; i++) {
            if (buffer[i] === 0) {
                return true;
            }
        }
        
        // Check for high ratio of non-printable characters
        let nonPrintable = 0;
        for (let i = 0; i < actualBytesToCheck; i++) {
            const byte = buffer[i];
            if (byte === undefined) continue; // Skip undefined bytes
            // Allow common whitespace chars: space(32), tab(9), newline(10), carriage return(13)
            if (byte < 32 && byte !== 9 && byte !== 10 && byte !== 13) {
                nonPrintable++;
            } else if (byte > 126) {
                nonPrintable++;
            }
        }
        
        // If more than 30% non-printable, consider it binary
        return (nonPrintable / actualBytesToCheck) > 0.3;
    } catch {
        // If we can't read the file, assume it's not binary
        return false;
    }
}

/**
 * Map file extensions to syntax highlighting languages for markdown/HTML
 * @param extensionOrBasename File extension or special basename
 * @returns Language identifier for syntax highlighting
 */
export function getMarkdownLanguage(extensionOrBasename: string): string {
    const languageMap: Record<string, string> = {
        // Extensions (alphabetized)
        '.bash': 'bash',
        '.bat': 'batch',
        '.c': 'c',
        '.cc': 'cpp',
        '.cfg': 'ini',
        '.cmake': 'cmake',
        '.cmd': 'batch',
        '.cpp': 'cpp',
        '.cs': 'csharp',
        '.css': 'css',
        '.cxx': 'cpp',
        '.dockerfile': 'dockerfile',
        '.Dockerfile': 'dockerfile',
        '.env': 'bash',
        '.fish': 'bash',
        '.gd': 'gdscript',
        '.gitattributes': 'text',
        '.gitignore': 'text',
        '.go': 'go',
        '.gql': 'graphql',
        '.gradle': 'gradle',
        '.graphql': 'graphql',
        '.h': 'c',
        '.hpp': 'cpp',
        '.htaccess': 'apache',
        '.html': 'html',
        '.hxx': 'cpp',
        '.import': 'ini',
        '.ini': 'ini',
        '.java': 'java',
        '.js': 'javascript',
        '.json': 'json',
        '.jsx': 'jsx',
        '.kt': 'kotlin',
        '.less': 'less',
        '.lua': 'lua',
        '.makefile': 'makefile',
        '.Makefile': 'makefile',
        '.md': 'markdown',
        '.mdx': 'markdown',
        '.perl': 'perl',
        '.php': 'php',
        '.pl': 'perl',
        '.proto': 'protobuf',
        '.ps1': 'powershell',
        '.py': 'python',
        '.r': 'r',
        '.rb': 'ruby',
        '.rs': 'rust',
        '.rst': 'rst',
        '.sass': 'sass',
        '.scala': 'scala',
        '.scss': 'scss',
        '.sh': 'bash',
        '.sql': 'sql',
        '.svelte': 'svelte',
        '.swift': 'swift',
        '.tex': 'latex',
        '.toml': 'toml',
        '.tres': 'gdscript',
        '.ts': 'typescript',
        '.tscn': 'gdscript',
        '.tsx': 'tsx',
        '.vue': 'vue',
        '.xml': 'xml',
        '.yaml': 'yaml',
        '.yml': 'yaml',
        '.zsh': 'bash',
        
        // Files without extensions (alphabetized by basename)
        'Cargo.lock': 'toml',
        'Cargo.toml': 'toml',
        'CMakeLists.txt': 'cmake',
        dockerfile: 'dockerfile',
        Dockerfile: 'dockerfile',
        Gemfile: 'ruby',
        'go.mod': 'go',
        'go.sum': 'text',
        Jenkinsfile: 'groovy',
        makefile: 'makefile',
        Makefile: 'makefile',
        'nginx.conf': 'nginx',
        Rakefile: 'ruby',
        'requirements.txt': 'text',
        Vagrantfile: 'ruby',
    };
    
    // Case-insensitive lookup with fallback to 'text'
    const lang = languageMap[extensionOrBasename.toLowerCase()] ?? languageMap[extensionOrBasename];
    return lang ?? 'text';
}

/**
 * Memory usage information
 */
export interface MemoryUsage {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
    heapUsedMB: number;
    heapTotalMB: number;
    externalMB: number;
    rssMB: number;
    heapUsagePercent: number;
}

/**
 * Get current memory usage statistics
 * @returns Memory usage information in bytes and MB
 */
export function getMemoryUsage(): MemoryUsage {
    const memUsage = process.memoryUsage();
    
    return {
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external,
        rss: memUsage.rss,
        heapUsedMB: memUsage.heapUsed / (1024 * 1024),
        heapTotalMB: memUsage.heapTotal / (1024 * 1024),
        externalMB: memUsage.external / (1024 * 1024),
        rssMB: memUsage.rss / (1024 * 1024),
        heapUsagePercent: (memUsage.heapUsed / memUsage.heapTotal) * 100
    };
}

/**
 * Check if memory usage is approaching dangerous levels
 * @param warnThresholdPercent Percentage of heap usage to warn at (default: 80%)
 * @param errorThresholdPercent Percentage of heap usage to error at (default: 90%)
 * @returns Warning/error information if thresholds exceeded
 */
export function checkMemoryUsage(
    warnThresholdPercent: number = 80,
    errorThresholdPercent: number = 90
): { level: 'ok' | 'warn' | 'error'; usage: MemoryUsage; message?: string } {
    const usage = getMemoryUsage();
    
    if (usage.heapUsagePercent >= errorThresholdPercent) {
        return {
            level: 'error',
            usage,
            message: `Critical memory usage: ${usage.heapUsagePercent.toFixed(1)}% of heap (${usage.heapUsedMB.toFixed(1)} MB / ${usage.heapTotalMB.toFixed(1)} MB). Consider reducing file size or using more specific filters.`
        };
    }
    
    if (usage.heapUsagePercent >= warnThresholdPercent) {
        return {
            level: 'warn',
            usage,
            message: `High memory usage: ${usage.heapUsagePercent.toFixed(1)}% of heap (${usage.heapUsedMB.toFixed(1)} MB / ${usage.heapTotalMB.toFixed(1)} MB). Monitor for potential issues.`
        };
    }
    
    return {
        level: 'ok',
        usage
    };
}

/**
 * Log memory usage if thresholds are exceeded
 * @param logPath Path to log file
 * @param prefix Prefix for log message
 * @param warnThreshold Warning threshold percentage
 * @param errorThreshold Error threshold percentage
 */
export async function logMemoryUsageIfNeeded(
    logPath: string,
    prefix: string = '',
    warnThreshold: number = 80,
    errorThreshold: number = 90
): Promise<void> {
    const memCheck = checkMemoryUsage(warnThreshold, errorThreshold);
    
    if (memCheck.level !== 'ok' && memCheck.message) {
        const logMessage = prefix ? `${prefix}: ${memCheck.message}` : memCheck.message;
        await writeLog(logPath, logMessage, true);
        
        if (memCheck.level === 'error') {
            console.error(logMessage);
        } else {
            console.warn(logMessage);
        }
    }
}