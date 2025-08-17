// SPDX-License-Identifier: MIT
// Copyright (c) 2025 the99studio
/**
 * Utilities for Project Fusion
 */
import path from 'node:path';
import fs from 'fs-extra';
import { z } from 'zod';
import { ConfigSchemaV1 } from './schema.js';
import { FusionError, type Config, type FilePath } from './types.js';


/**
 * Default configuration for Project Fusion
 */
export const defaultConfig = {
    copyToClipboard: false,
    generatedFileName: "project-fusioned",
    generateHtml: true,
    generateMarkdown: true,
    generateText: true,
    maxFileSizeKB: 1024,
    parseSubDirectories: true,
    parsedFileExtensions: {
        backend: [".cs", ".go", ".java", ".php", ".py", ".rb", ".rs"] as const,
        config: [".json", ".toml", ".xml", ".yaml", ".yml"] as const,
        cpp: [".c", ".cc", ".cpp", ".h", ".hpp"] as const,
        doc: [".adoc", ".md", ".rst"] as const,
        godot: [".cfg", ".cs", ".gd", ".import", ".tscn", ".tres"] as const,
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

        const parsedConfig = JSON.parse(configContent);

        try {
            const validatedConfig = ConfigSchemaV1.parse(parsedConfig);
            return validatedConfig;
        } catch (zodError: unknown) {
            // Graceful degradation with detailed error reporting
            if (zodError instanceof z.ZodError) {
                console.error('Configuration validation failed (will use default config):');
                for (const [index, issue] of zodError.issues.entries()) {
                    const path = issue.path.length > 0 ? issue.path.join('.') : 'root';
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const value = issue.path.reduce((obj: any, key) => obj?.[key], parsedConfig);
                    console.error(`  ${index + 1}. Path: ${path}`);
                    console.error(`     Error: ${issue.message}`);
                    console.error(`     Current value: ${JSON.stringify(value)}`);
                    if (issue.code === 'invalid_type') {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        console.error(`     Expected type: ${(issue as any).expected}, received: ${(issue as any).received}`);
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
 * Read file content
 * @param filePath Path to file
 * @returns File content
 */
export async function readFileContent(filePath: string): Promise<string> {
    try {
        return await fs.readFile(filePath, 'utf8');
    } catch (error) {
        console.error(`Error reading file ${filePath}:`, error);
        throw error;
    }
}

/**
 * Write detailed configuration summary to log for debugging
 * @param logFilePath Path to log file
 * @param config Configuration to log
 */
export async function logConfigSummary(logFilePath: FilePath, config: Config): Promise<void> {
    await writeLog(logFilePath, `Configuration Summary:`, true);
    await writeLog(logFilePath, `  Schema Version: ${config.schemaVersion}`, true);
    await writeLog(logFilePath, `  Root Directory: ${config.rootDirectory}`, true);
    await writeLog(logFilePath, `  Scan Subdirectories: ${config.parseSubDirectories ? 'Yes' : 'No'}`, true);
    await writeLog(logFilePath, `  Use .gitignore: ${config.useGitIgnoreForExcludes ? 'Yes' : 'No'}`, true);
    await writeLog(logFilePath, `  Copy to Clipboard: ${config.copyToClipboard ? 'Yes' : 'No'}`, true);
    await writeLog(logFilePath, `  Max File Size: ${config.maxFileSizeKB} KB`, true);
    
    // Output files
    await writeLog(logFilePath, `  Generated File Name: ${config.generatedFileName}`, true);
    await writeLog(logFilePath, `  Generate Text: ${config.generateText ? 'Yes' : 'No'}`, true);
    await writeLog(logFilePath, `  Generate Markdown: ${config.generateMarkdown ? 'Yes' : 'No'}`, true);
    await writeLog(logFilePath, `  Generate HTML: ${config.generateHtml ? 'Yes' : 'No'}`, true);
    
    // File type statistics
    const totalExtensions = getExtensionsFromGroups(config);
    await writeLog(logFilePath, `  Extension Groups: ${Object.keys(config.parsedFileExtensions).length} groups`, true);
    await writeLog(logFilePath, `  Total Extensions: ${totalExtensions.length}`, true);
    
    // Exclusion pattern count
    await writeLog(logFilePath, `  Ignore Patterns: ${config.ignorePatterns.length} patterns`, true);
    
    await writeLog(logFilePath, ``, true); // Empty line for separation
}

/**
 * Write content to file
 * @param filePath Path to file
 * @param content Content to write
 */
export async function writeFileContent(filePath: string, content: string): Promise<void> {
    try {
        await ensureDirectoryExists(path.dirname(filePath));
        await fs.writeFile(filePath, content);
    } catch (error) {
        console.error(`Error writing file ${filePath}:`, error);
        throw error;
    }
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

    // Collect extensions from specified groups with validation
    return groups.reduce((acc: string[], group: string) => {
        const extensions = config.parsedFileExtensions[group];
        if (extensions) {
            acc.push(...extensions);
        } else {
            throw new FusionError(
                `Extension group '${group}' not found in config`, 
                'UNKNOWN_EXTENSION_GROUP', 
                'warning',
                { group, availableGroups: Object.keys(config.parsedFileExtensions) }
            );
        }
        return acc;
    }, []);
}

/**
 * Map file extensions to syntax highlighting languages for markdown/HTML
 * @param extensionOrBasename File extension or special basename
 * @returns Language identifier for syntax highlighting
 */
export function getMarkdownLanguage(extensionOrBasename: string): string {
    // Comprehensive mapping for syntax highlighting across multiple formats
    const languageMap: Record<string, string> = {
        // Backend (alphabetized)
        '.cs': 'csharp',
        '.go': 'go',
        '.java': 'java',
        '.kt': 'kotlin',
        '.lua': 'lua',
        '.perl': 'perl',
        '.php': 'php',
        '.pl': 'perl',
        '.py': 'python',
        '.r': 'r',
        '.rb': 'ruby',
        '.rs': 'rust',
        '.scala': 'scala',
        '.swift': 'swift',
        
        // C/C++ (alphabetized)
        '.c': 'c',
        '.cc': 'cpp',
        '.cpp': 'cpp',
        '.cxx': 'cpp',
        '.h': 'c',
        '.hpp': 'cpp',
        '.hxx': 'cpp',
        
        // Config (alphabetized)
        '.env': 'bash',
        '.ini': 'ini',
        '.json': 'json',
        '.toml': 'toml',
        '.xml': 'xml',
        '.yaml': 'yaml',
        '.yml': 'yaml',
        
        // Database
        '.sql': 'sql',
        
        // Documentation (alphabetized)
        '.md': 'markdown',
        '.mdx': 'markdown',
        '.rst': 'rst',
        '.tex': 'latex',
        
        // Godot (alphabetized)
        '.cfg': 'ini',
        '.gd': 'gdscript',
        '.import': 'ini',
        '.tres': 'gdscript',
        '.tscn': 'gdscript',
        
        // Other (alphabetized)
        '.cmake': 'cmake',
        '.dockerfile': 'dockerfile',
        '.Dockerfile': 'dockerfile',
        '.gql': 'graphql',
        '.gradle': 'gradle',
        '.graphql': 'graphql',
        '.makefile': 'makefile',
        '.Makefile': 'makefile',
        '.proto': 'protobuf',
        
        // Shell/Scripts (alphabetized)
        '.bash': 'bash',
        '.bat': 'batch',
        '.cmd': 'batch',
        '.fish': 'bash',
        '.ps1': 'powershell',
        '.sh': 'bash',
        '.zsh': 'bash',
        
        // Web (alphabetized)
        '.css': 'css',
        '.html': 'html',
        '.js': 'javascript',
        '.jsx': 'jsx',
        '.less': 'less',
        '.sass': 'sass',
        '.scss': 'scss',
        '.svelte': 'svelte',
        '.ts': 'typescript',
        '.tsx': 'tsx',
        '.vue': 'vue',
        
        // Files without extensions (alphabetized by basename)
        '.gitattributes': 'text',
        '.gitignore': 'text',
        '.htaccess': 'apache',
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