// SPDX-License-Identifier: MIT
// Copyright (c) 2025 the99studio
/**
 * Utilities for Project Fusion
 */
import path from 'node:path';
import process from 'node:process';

import chalk from 'chalk';
import fs from 'fs-extra';
import { z } from 'zod';

import { ConfigSchemaV1 } from './schema.js';
import { type Config, FusionError, isNonEmptyArray, isValidExtensionGroup } from './types.js';
import { logger as structuredLogger } from './utils/logger.js';

// Global symlink audit tracker
const symlinkAuditTracker = new Map<string, { count: number; entries: Array<{ symlink: string; target: string; timestamp: Date }> }>();


/**
 * Default configuration for Project Fusion
 */
export const defaultConfig = {
    allowExternalPlugins: false,
    allowedExternalPluginPaths: [],
    allowSymlinks: false,
    copyToClipboard: false,
    excludeSecrets: true,
    generatedFileName: "project-fusioned",
    generateHtml: true,
    generateMarkdown: true,
    generateText: true,
    ignorePatterns: [
        // Binary files and archives
        "*.7z",
        "*.a",
        "*.avi",
        "*.bmp",
        "*.blend",
        "*.class",
        "*.dll",
        "*.doc",
        "*.docx",
        "*.dylib",
        "*.exe",
        "*.fbx",
        "*.flac",
        "*.flv",
        "*.gif",
        "*.gz",
        "*.ico",
        "*.jar",
        "*.jpeg",
        "*.jpg",
        "*.key",
        "*.log",
        "*.min.css",
        "*.min.js",
        "*.mov",
        "*.mp3",
        "*.mp4",
        "*.o",
        "*.obj",
        "*.pdf",
        "*.pem",
        "*.png",
        "*.ppt",
        "*.pptx",
        "*.pyc",
        "*.pyo",
        "*.rar",
        "*.so",
        "*.svg",
        "*.swo",
        "*.swp",
        "*.tar",
        "*.tgz",
        "*.uasset",
        "*.unitypackage",
        "*.war",
        "*.wav",
        "*.webp",
        "*.wmv",
        "*.xls",
        "*.xlsx",
        "*.zip",
        "**/credentials/*",
        "**/secrets/*",
        ".DS_Store",
        ".env",
        ".env.*",
        ".idea/",
        ".vscode/",
        "build/",
        "dist/",
        "logs/",
        "node_modules/",
        "package-lock.json",
        "pnpm-lock.yaml",
        "project-fusion.json",
        "project-fusion.log",
        "project-fusioned.*",
        "Thumbs.db",
        "yarn.lock"
    ],
    maxBase64BlockKB: 2,
    maxFileSizeKB: 1024,
    maxFiles: 10000,
    maxLineLength: 5000,
    maxSymlinkAuditEntries: 10,
    maxTokenLength: 2000,
    maxTotalSizeMB: 100,
    parsedFileExtensions: {
        backend: [".cs", ".go", ".java", ".php", ".py", ".rb", ".rs"] as const,
        config: [".json", ".toml", ".xml", ".yaml", ".yml"] as const,
        cpp: [".c", ".cc", ".cpp", ".h", ".hpp"] as const,
        doc: [".adoc", ".md", ".rst"] as const,
        godot: [".cfg", ".cs", ".gd", ".import", ".tres", ".tscn"] as const,
        scripts: [".bat", ".cmd", ".ps1", ".sh"] as const,
        web: [".css", ".html", ".js", ".jsx", ".svelte", ".ts", ".tsx", ".vue"] as const
    },
    parseSubDirectories: true,
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
 * Console logging utilities with consistent styling
 */
export const consoleLogger = {
    info: (message: string) => console.log(chalk.blue(message)),
    success: (message: string) => console.log(chalk.green(message)),
    warning: (message: string) => console.log(chalk.yellow(message)),
    error: (message: string) => console.log(chalk.red(message)),
    secondary: (message: string) => console.log(chalk.cyan(message)),
    muted: (message: string) => console.log(chalk.gray(message))
};

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
    groups?: readonly string[]
): string[] {
    // Return all extensions if no specific groups requested
    if (!groups || groups.length === 0) {
        const result: string[] = [];
        for (const extensions of Object.values(config.parsedFileExtensions)) {
            if (extensions) {
                result.push(...extensions);
            }
        }
        return result;
    }

    // Validate and collect extensions from specified groups
    const result: string[] = [];
    for (const group of groups) {
        // Type-safe group validation
        if (!isValidExtensionGroup(group)) {
            console.warn(`Unknown extension group '${group}'. Valid groups: ${Object.keys(config.parsedFileExtensions).join(', ')}`);
            continue;
        }

        const extensions = config.parsedFileExtensions[group];
        if (extensions && isNonEmptyArray(extensions)) {
            result.push(...extensions);
        } else {
            console.warn(`Extension group '${group}' is empty or not found in configuration`);
        }
    }
    return result;
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
export async function validateNoSymlinks(filePath: string, allowSymlinks: boolean = false, config?: Config): Promise<boolean> {
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
            
            // If symlinks are allowed, perform audit logging
            await auditSymlink(filePath, config);
        }
        
        return true;
    } catch (error) {
        if (error instanceof FusionError) {
            throw error;
        }
        
        // Check if this is a broken symlink (lstat failed but readlink might work)
        if (allowSymlinks) {
            try {
                await fs.readlink(filePath);
                // It's a broken symlink, audit it
                await auditSymlink(filePath, config);
                return false; // File doesn't exist but symlink was processed
            } catch {
                // Not a symlink, just a missing file
            }
        }
        
        // If lstat fails, the file doesn't exist or is inaccessible
        return false;
    }
}

/**
 * Audit a symlink by resolving its target and logging for security tracking
 * @param symlinkPath Path to the symbolic link
 * @param config Configuration containing audit limits
 */
async function auditSymlink(symlinkPath: string, config?: Config): Promise<void> {
    const maxEntries = config?.maxSymlinkAuditEntries ?? 10;
    const sessionKey = config?.rootDirectory ?? 'default';
    
    // Get or create session tracker
    if (!symlinkAuditTracker.has(sessionKey)) {
        symlinkAuditTracker.set(sessionKey, { count: 0, entries: [] });
    }
    
    const tracker = symlinkAuditTracker.get(sessionKey)!;
    tracker.count++;
    
    try {
        // Resolve the symlink target
        const resolvedTarget = await fs.realpath(symlinkPath);
        const relativePath = path.relative(process.cwd(), resolvedTarget);
        const isRelative = !path.isAbsolute(relativePath) && !relativePath.startsWith('..');
        
        // Check if target exists and get additional info
        let targetExists = true;
        let targetType = 'unknown';
        try {
            const targetStats = await fs.stat(resolvedTarget);
            targetType = targetStats.isDirectory() ? 'directory' : 
                        targetStats.isFile() ? 'file' : 'other';
        } catch {
            targetExists = false;
        }
        
        // Log within limit
        if (tracker.entries.length < maxEntries) {
            const auditEntry = {
                symlink: symlinkPath,
                target: resolvedTarget,
                timestamp: new Date()
            };
            
            tracker.entries.push(auditEntry);
            
            // Log with security warning banner
            structuredLogger.warn(`🔗 SYMLINK AUDIT [${tracker.count}]: '${symlinkPath}' → '${resolvedTarget}'`, {
                symlink: symlinkPath,
                target: resolvedTarget,
                targetExists,
                targetType,
                isExternalTarget: !isRelative,
                auditCount: tracker.count,
                sessionKey
            });
        } else if (tracker.entries.length === maxEntries) {
            // Log limit reached message once
            structuredLogger.warn(`🔗 SYMLINK AUDIT LIMIT REACHED: Further symlinks will be processed but not logged (limit: ${maxEntries})`, {
                totalSymlinks: tracker.count,
                maxEntries,
                sessionKey
            });
        }
        
    } catch (error) {
        // Log symlink resolution failure
        structuredLogger.error(`🔗 SYMLINK AUDIT ERROR: Failed to resolve '${symlinkPath}'`, {
            symlink: symlinkPath,
            error: error instanceof Error ? error.message : String(error),
            auditCount: tracker.count
        });
    }
}

/**
 * Get symlink audit summary for the current session
 * @param sessionKey Session identifier (typically rootDirectory)
 * @returns Audit summary or null if no symlinks processed
 */
export function getSymlinkAuditSummary(sessionKey: string = 'default'): { 
    totalSymlinks: number; 
    entries: Array<{ symlink: string; target: string; timestamp: Date }> 
} | null {
    const tracker = symlinkAuditTracker.get(sessionKey);
    return tracker ? { 
        totalSymlinks: tracker.count, 
        entries: [...tracker.entries] 
    } : null;
}

/**
 * Clear symlink audit data for a session
 * @param sessionKey Session identifier (typically rootDirectory)
 */
export function clearSymlinkAudit(sessionKey: string = 'default'): void {
    symlinkAuditTracker.delete(sessionKey);
}

/**
 * Detect if a file appears to be binary
 * @param filePath Path to the file
 * @param sampleSize Number of bytes to sample (default: 1024)
 * @returns True if the file appears to be binary
 */
export async function isBinaryFile(filePath: string, sampleSize: number = 1024): Promise<boolean> {
    // Check cache first
    const cached = binaryFileCache.get(filePath);
    if (cached !== undefined) {
        return cached;
    }
    
    try {
        const stats = await fs.stat(filePath);
        if (stats.size === 0) {
            binaryFileCache.set(filePath, false);
            return false; // Empty file is not binary
        }
        
        // Read only the first part of the file for analysis
        const bytesToRead = Math.min(stats.size, sampleSize);
        const buffer = await fs.readFile(filePath, { encoding: null });
        const actualBytesToCheck = Math.min(buffer.length, bytesToRead);
        
        // Check for null bytes which indicate binary content
        for (let i = 0; i < actualBytesToCheck; i++) {
            if (buffer[i] === 0) {
                binaryFileCache.set(filePath, true);
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
        const isBinary = (nonPrintable / actualBytesToCheck) > 0.3;
        binaryFileCache.set(filePath, isBinary);
        return isBinary;
    } catch {
        // If we can't read the file, assume it's not binary
        binaryFileCache.set(filePath, false);
        return false;
    }
}

// Create language map once at module level for better performance
const LANGUAGE_MAP = new Map<string, string>([
    // Extensions (alphabetized)
    ['.bash', 'bash'],
    ['.bat', 'batch'],
    ['.c', 'c'],
    ['.cc', 'cpp'],
    ['.cfg', 'ini'],
    ['.cmake', 'cmake'],
    ['.cmd', 'batch'],
    ['.cpp', 'cpp'],
    ['.cs', 'csharp'],
    ['.css', 'css'],
    ['.cxx', 'cpp'],
    ['.dockerfile', 'dockerfile'],
    ['.Dockerfile', 'dockerfile'],
    ['.env', 'bash'],
    ['.fish', 'bash'],
    ['.gd', 'gdscript'],
    ['.gitattributes', 'text'],
    ['.gitignore', 'text'],
    ['.go', 'go'],
    ['.gql', 'graphql'],
    ['.gradle', 'gradle'],
    ['.graphql', 'graphql'],
    ['.h', 'c'],
    ['.hpp', 'cpp'],
    ['.htaccess', 'apache'],
    ['.html', 'html'],
    ['.hxx', 'cpp'],
    ['.import', 'ini'],
    ['.ini', 'ini'],
    ['.java', 'java'],
    ['.js', 'javascript'],
    ['.json', 'json'],
    ['.jsx', 'jsx'],
    ['.kt', 'kotlin'],
    ['.less', 'less'],
    ['.lua', 'lua'],
    ['.makefile', 'makefile'],
    ['.Makefile', 'makefile'],
    ['.md', 'markdown'],
    ['.mdx', 'markdown'],
    ['.perl', 'perl'],
    ['.php', 'php'],
    ['.pl', 'perl'],
    ['.proto', 'protobuf'],
    ['.ps1', 'powershell'],
    ['.py', 'python'],
    ['.r', 'r'],
    ['.rb', 'ruby'],
    ['.rs', 'rust'],
    ['.rst', 'rst'],
    ['.sass', 'sass'],
    ['.scala', 'scala'],
    ['.scss', 'scss'],
    ['.sh', 'bash'],
    ['.sql', 'sql'],
    ['.svelte', 'svelte'],
    ['.swift', 'swift'],
    ['.tex', 'latex'],
    ['.toml', 'toml'],
    ['.tres', 'gdscript'],
    ['.ts', 'typescript'],
    ['.tscn', 'gdscript'],
    ['.tsx', 'tsx'],
    ['.vue', 'vue'],
    ['.xml', 'xml'],
    ['.yaml', 'yaml'],
    ['.yml', 'yaml'],
    ['.zsh', 'bash'],
    
    // Files without extensions (alphabetized by basename)
    ['Cargo.lock', 'toml'],
    ['Cargo.toml', 'toml'],
    ['CMakeLists.txt', 'cmake'],
    ['dockerfile', 'dockerfile'],
    ['Dockerfile', 'dockerfile'],
    ['Gemfile', 'ruby'],
    ['go.mod', 'go'],
    ['go.sum', 'text'],
    ['Jenkinsfile', 'groovy'],
    ['makefile', 'makefile'],
    ['Makefile', 'makefile'],
    ['nginx.conf', 'nginx'],
    ['Rakefile', 'ruby'],
    ['requirements.txt', 'text'],
    ['Vagrantfile', 'ruby'],
]);

/**
 * Map file extensions to syntax highlighting languages for markdown/HTML
 * @param extensionOrBasename File extension or special basename
 * @returns Language identifier for syntax highlighting
 */
export function getMarkdownLanguage(extensionOrBasename: string): string {
    // Case-insensitive lookup with fallback to 'text'
    const lang = LANGUAGE_MAP.get(extensionOrBasename.toLowerCase()) ?? LANGUAGE_MAP.get(extensionOrBasename);
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

// Simple cache for binary file detection to avoid repeated checks
const binaryFileCache = new Map<string, boolean>();

/**
 * Content validation result
 */
export interface ContentValidationResult {
    valid: boolean;
    warnings: string[];
    errors: string[];
    issues: {
        hasLargeBase64?: boolean;
        hasLongLines?: boolean;
        hasLongTokens?: boolean;
        base64BlockSize?: number;
        maxLineLength?: number;
        maxTokenLength?: number;
        hasSecrets?: boolean;
        secretTypes?: string[];
    };
}

/**
 * Secret detection patterns for common API keys and sensitive data
 */
export const SECRET_PATTERNS = [
    { name: 'AWS Access Key', regex: /(AKIA[0-9A-Z]{16})/ },
    { name: 'AWS Secret Key', regex: /([A-Za-z0-9/+=]{40})(?=.*aws|.*secret|.*key)/i },
    { name: 'RSA Private Key', regex: /-----BEGIN (?:RSA|EC|DSA|OPENSSH) PRIVATE KEY-----/ },
    { name: 'SSH Private Key', regex: /-----BEGIN (?:RSA|DSA|EC|OPENSSH) PRIVATE KEY-----/ },
    { name: 'PGP Private Key', regex: /-----BEGIN PGP PRIVATE KEY BLOCK-----/ },
    { name: 'Slack Token', regex: /(xox[abpr]-[0-9A-Za-z-]{10,100})/ },
    { name: 'Google API Key', regex: /(AIza[0-9A-Za-z-_]{20,})/ },
    { name: 'GitHub Token', regex: /(gh[ps]_[A-Za-z0-9]{36,})/ },
    { name: 'Stripe Key', regex: /(sk_(?:test_|live_)[0-9a-zA-Z]{24,})/ },
    { name: 'PayPal/Braintree Token', regex: /(access_token\$production\$[0-9a-z]{16}\$[0-9a-f]{32})/ },
    { name: 'Square Token', regex: /(sq0[a-z]{3}-[0-9A-Za-z-_]{22,43})/ },
    { name: 'Twilio Key', regex: /(SK[0-9a-fA-F]{32})/ },
    { name: 'MailChimp Key', regex: /([0-9a-f]{32}-us[0-9]{1,2})/ },
    { name: 'SendGrid Key', regex: /(SG\.[0-9A-Za-z-_]{22}\.[0-9A-Za-z-_]{43})/ },
    { name: 'Heroku API Key', regex: /([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})(?=.*heroku)/i },
    { name: 'JWT Token', regex: /(ey[A-Za-z0-9-_]+\.ey[A-Za-z0-9-_]+\.[A-Za-z0-9-_.+/=]*)/ },
    { name: 'npm Token', regex: /(npm_[A-Za-z0-9]{36})/ },
    { name: 'Generic API Key', regex: /(api[_-]?key[_-]?[=:]\s*["']?[A-Za-z0-9-_]{32,}["']?)/i },
    { name: 'Generic Secret', regex: /(secret[_-]?[=:]\s*["']?[A-Za-z0-9-_]{16,}["']?)/i },
    { name: 'Password Field', regex: /(password[_-]?[=:]\s*["']?[^\s"']{8,}["']?)/i }
];

/**
 * Redact secrets from content by replacing them with [REDACTED]
 * @param content File content to redact
 * @returns Content with secrets replaced
 */
export function redactSecrets(content: string): { redactedContent: string; detectedSecrets: string[] } {
    let redactedContent = content;
    const detectedSecrets: string[] = [];
    const seenTypes = new Set<string>();
    
    for (const pattern of SECRET_PATTERNS) {
        if (pattern.regex.test(redactedContent)) {
            if (!seenTypes.has(pattern.name)) {
                detectedSecrets.push(pattern.name);
                seenTypes.add(pattern.name);
            }
            // Replace all matches with [REDACTED]
            redactedContent = redactedContent.replace(
                new RegExp(pattern.regex.source, pattern.regex.flags + (pattern.regex.global ? '' : 'g')),
                '[REDACTED]'
            );
        }
    }
    
    return { redactedContent, detectedSecrets };
}

/**
 * Validate file content against content validation rules
 * @param content File content to validate
 * @param filePath Path to the file (for logging)
 * @param config Content validation configuration
 * @returns Validation result
 */
export function validateFileContent(
    content: string,
    filePath: string,
    config: Config
): ContentValidationResult {
    const result: ContentValidationResult = {
        valid: true,
        warnings: [],
        errors: [],
        issues: {}
    };

    // Check for large base64 blocks
    const base64Regex = /[A-Za-z0-9+/]{100,}={0,2}/g;
    const base64Matches = content.match(base64Regex);
    if (base64Matches) {
        const largestBase64 = Math.max(...base64Matches.map(match => match.length));
        const base64SizeKB = (largestBase64 * 3) / 4 / 1024; // Approximate decoded size
        
        if (base64SizeKB > config.maxBase64BlockKB) {
            result.issues.hasLargeBase64 = true;
            result.issues.base64BlockSize = Math.round(base64SizeKB * 100) / 100;
            
            const message = `Large base64 block detected: ${result.issues.base64BlockSize}KB (limit: ${config.maxBase64BlockKB}KB) in ${filePath}`;
            result.errors.push(message);
            result.valid = false;
        }
    }

    // Check for long lines
    const lines = content.split('\n');
    const maxLineLength = Math.max(...lines.map(line => line.length));
    if (maxLineLength > config.maxLineLength) {
        result.issues.hasLongLines = true;
        result.issues.maxLineLength = maxLineLength;
        
        const message = `Long line detected: ${maxLineLength} chars (limit: ${config.maxLineLength}) in ${filePath}`;
        result.errors.push(message);
        result.valid = false;
    }

    // Check for long tokens (potential minified content)
    // Skip base64-like tokens to avoid double-reporting
    const tokens: string[] = [];
    const splitTokens = content.split(/\s+/);
    
    for (const token of splitTokens) {
        // More precise base64 detection: must be long, have high base64 char ratio,
        // and match typical base64 patterns (no underscores, proper padding, etc.)
        if (token.length <= 100) {
            tokens.push(token);
            continue;
        }
        
        const base64Chars = token.match(/[A-Za-z0-9+/=]/g);
        const base64Ratio = base64Chars ? base64Chars.length / token.length : 0;
        
        // Check if it's actually base64-like:
        // 1. High ratio of base64 characters (>95%)
        // 2. No underscores (common in function names but not base64)
        // 3. Proper base64 ending pattern (handles quotes around base64 strings)
        const hasUnderscores = token.includes('_');
        // Check for base64 ending pattern, accounting for quotes and semicolons
        const hasProperBase64Ending = /[A-Za-z0-9+/]={0,2}[";]*$/.test(token);
        const isLikelyBase64 = base64Ratio > 0.95 && !hasUnderscores && hasProperBase64Ending;
        
        if (!isLikelyBase64) {
            tokens.push(token);
        }
    }
    
    if (tokens.length > 0) {
        const maxTokenLength = Math.max(...tokens.map(token => token.length));
        if (maxTokenLength > config.maxTokenLength) {
            result.issues.hasLongTokens = true;
            result.issues.maxTokenLength = maxTokenLength;
            
            const message = `Long token detected: ${maxTokenLength} chars (limit: ${config.maxTokenLength}) - possible minified content in ${filePath}`;
            result.errors.push(message);
            result.valid = false;
        }
    }

    // Check for secrets if enabled
    if (config.excludeSecrets) {
        const { detectedSecrets } = redactSecrets(content);
        
        if (detectedSecrets.length > 0) {
            result.issues.hasSecrets = true;
            result.issues.secretTypes = detectedSecrets;
            
            // Always just warn about secrets - they will be redacted
            const message = `Secrets detected and redacted in ${filePath}: ${detectedSecrets.join(', ')}`;
            result.warnings.push(message);
        }
    }

    return result;
}

/**
 * Check if content appears to be minified based on common patterns
 * @param content File content
 * @param filePath File path for context
 * @returns True if content appears minified
 */
export function isMinifiedContent(content: string, filePath: string): boolean {
    // Skip check for files already identified as minified
    if (filePath.includes('.min.') || filePath.includes('-min.')) {
        return true;
    }

    const lines = content.split('\n');
    const nonEmptyLines = lines.filter(line => line.trim().length > 0);
    
    if (nonEmptyLines.length === 0) return false;

    // Calculate average line length
    const totalLength = nonEmptyLines.reduce((sum, line) => sum + line.length, 0);
    const avgLineLength = totalLength / nonEmptyLines.length;

    // Check for typical minification indicators
    const veryLongLines = nonEmptyLines.filter(line => line.length > 1000).length;
    const longLineRatio = veryLongLines / nonEmptyLines.length;
    
    // Consider it minified if:
    // - Average line length > 250 chars AND more than 20% are very long lines
    // - OR any single line > 5000 chars
    // - OR average line length > 300 chars (regardless of line count)
    return (avgLineLength > 250 && longLineRatio > 0.2) || 
           nonEmptyLines.some(line => line.length > 5000) ||
           avgLineLength > 300;
}