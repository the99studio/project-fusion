/**
 * Utilities for Project Fusion
 */
import fs from 'fs-extra';
import path from 'path';
import { z } from 'zod';
import { ConfigSchemaV1 } from './schema.js';
import { Config, FilePath } from './types.js';


/**
 * Default configuration for Project Fusion
 */
export const defaultConfig = {
    generatedFileName: "project-fusioned",
    copyToClipboard: false,
    generateText: true,
    generateMarkdown: true,
    generateHtml: true,
    generatePdf: true,
    parsedFileExtensions: {
        backend: [".cs", ".go", ".java", ".php", ".py", ".rb", ".rs"],
        config: [".json", ".toml", ".xml", ".yaml", ".yml"],
        cpp: [".c", ".cc", ".cpp", ".h", ".hpp"],
        scripts: [".bat", ".cmd", ".ps1", ".sh"],
        web: [".css", ".html", ".js", ".jsx", ".svelte", ".ts", ".tsx", ".vue"],
        godot: [".gd", ".cs", ".tscn", ".tres", ".cfg", ".import"],
        doc: [".md", ".rst", ".adoc"]
    },
    parsing: {
        parseSubDirectories: true,
        rootDirectory: ".",
        maxFileSizeKB: 1024
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
    useGitIgnoreForExcludes: true,
    schemaVersion: 1
} as const satisfies Config;


/**
 * Load config from file
 * @returns The loaded configuration
 */
export async function loadConfig(): Promise<Config> {
    try {
        const configPath = path.resolve('./project-fusion.json');
        
        let configContent: string;
        try {
            configContent = await fs.readFile(configPath, 'utf8');
        } catch (error) {
            return defaultConfig;
        }

        const parsedConfig = JSON.parse(configContent);

        try {
            const validatedConfig = ConfigSchemaV1.parse(parsedConfig);
            return validatedConfig;
        } catch (zodError: unknown) {
            if (zodError instanceof z.ZodError) {
                console.error('Configuration validation failed (will use default config):');
                zodError.issues.forEach((issue, index) => {
                    const path = issue.path.length > 0 ? issue.path.join('.') : 'root';
                    const value = issue.path.reduce((obj: any, key) => obj?.[key], parsedConfig);
                    console.error(`  ${index + 1}. Path: ${path}`);
                    console.error(`     Error: ${issue.message}`);
                    console.error(`     Current value: ${JSON.stringify(value)}`);
                    if (issue.code === 'invalid_type') {
                        console.error(`     Expected type: ${(issue as any).expected}, received: ${(issue as any).received}`);
                    }
                });
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
 * Ensure a directory exists
 * @param directory Directory path
 */
export async function ensureDirectoryExists(directory: string): Promise<void> {
    await fs.ensureDir(directory);
}

/**
 * Write log content to file and optionally to console
 * @param logFilePath Path to log file
 * @param content Content to log
 * @param append If true, append to existing file
 * @param consoleOutput If true, also display on console
 */
export async function writeLog(
    logFilePath: string,
    content: string,
    append: boolean = false,
    consoleOutput: boolean = false
): Promise<void> {
    try {
        await ensureDirectoryExists(path.dirname(logFilePath));
        if (append) {
            await fs.appendFile(logFilePath, content + '\n');
        } else {
            await fs.writeFile(logFilePath, content + '\n');
        }

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
    return (date || new Date()).toISOString();
}

/**
 * Format a local timestamp for display
 * @param date Optional date to format, defaults to current date
 * @returns Formatted local timestamp
 */
export function formatLocalTimestamp(date?: Date): string {
    const now = date || new Date();
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
 * Read file content with size limit check
 * @param filePath Path to file
 * @param maxSizeKB Maximum file size in KB
 * @returns File content or null if file exceeds size limit
 */
export async function readFileContentWithSizeLimit(
    filePath: string, 
    maxSizeKB: number
): Promise<{ content: string | null; skipped: boolean; size: number }> {
    try {
        const stats = await fs.stat(filePath);
        const sizeKB = stats.size / 1024;
        
        if (sizeKB > maxSizeKB) {
            console.log(`Skipping large file ${filePath} (${sizeKB.toFixed(2)} KB > ${maxSizeKB} KB limit)`);
            return { content: null, skipped: true, size: stats.size };
        }
        
        const content = await fs.readFile(filePath, 'utf8');
        return { content, skipped: false, size: stats.size };
    } catch (error) {
        console.error(`Error reading file ${filePath}:`, error);
        throw error;
    }
}

/**
 * Log configuration summary to log file
 * @param logFilePath Path to log file
 * @param config Configuration to log
 */
export async function logConfigSummary(logFilePath: FilePath, config: Config): Promise<void> {
    await writeLog(logFilePath, `Configuration Summary:`, true);
    await writeLog(logFilePath, `  Schema Version: ${config.schemaVersion}`, true);
    await writeLog(logFilePath, `  Root Directory: ${config.parsing.rootDirectory}`, true);
    await writeLog(logFilePath, `  Scan Subdirectories: ${config.parsing.parseSubDirectories ? 'Yes' : 'No'}`, true);
    await writeLog(logFilePath, `  Use .gitignore: ${config.useGitIgnoreForExcludes ? 'Yes' : 'No'}`, true);
    await writeLog(logFilePath, `  Copy to Clipboard: ${config.copyToClipboard ? 'Yes' : 'No'}`, true);
    await writeLog(logFilePath, `  Max File Size: ${config.parsing.maxFileSizeKB} KB`, true);
    
    // Output files
    await writeLog(logFilePath, `  Generated File Name: ${config.generatedFileName}`, true);
    await writeLog(logFilePath, `  Generate Text: ${config.generateText ? 'Yes' : 'No'}`, true);
    await writeLog(logFilePath, `  Generate Markdown: ${config.generateMarkdown ? 'Yes' : 'No'}`, true);
    await writeLog(logFilePath, `  Generate HTML: ${config.generateHtml ? 'Yes' : 'No'}`, true);
    await writeLog(logFilePath, `  Generate PDF: ${config.generatePdf ? 'Yes' : 'No'}`, true);
    
    // Extension groups summary
    const totalExtensions = getExtensionsFromGroups(config);
    await writeLog(logFilePath, `  Extension Groups: ${Object.keys(config.parsedFileExtensions).length} groups`, true);
    await writeLog(logFilePath, `  Total Extensions: ${totalExtensions.length}`, true);
    
    // Ignore patterns count
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
 * Get extensions from specified groups
 * @param config Config object
 * @param groups Extension groups
 * @returns Array of extensions
 */
export function getExtensionsFromGroups(
    config: Config,
    groups?: string[]
): string[] {
    if (!groups || groups.length === 0) {
        return Object.values(config.parsedFileExtensions)
            .filter((extensions): extensions is string[] => Boolean(extensions))
            .flat();
    }

    return groups.reduce((acc: string[], group: string) => {
        const extensions = config.parsedFileExtensions[group];
        if (extensions) {
            acc.push(...extensions);
        } else {
            console.warn(`Warning: Extension group '${group}' not found in config`);
        }
        return acc;
    }, []);
}

/**
 * Map file extensions and basenames to markdown code block languages
 * @param extensionOrBasename File extension (e.g., '.ts', '.json') or basename (e.g., 'Makefile', 'Dockerfile')
 * @returns Markdown language identifier or empty string for text
 */
export function getMarkdownLanguage(extensionOrBasename: string): string {
    const languageMap: Record<string, string> = {
        // Web
        '.js': 'javascript',
        '.jsx': 'jsx',
        '.ts': 'typescript',
        '.tsx': 'tsx',
        '.html': 'html',
        '.css': 'css',
        '.scss': 'scss',
        '.sass': 'sass',
        '.less': 'less',
        '.vue': 'vue',
        '.svelte': 'svelte',
        
        // Backend
        '.py': 'python',
        '.rb': 'ruby',
        '.java': 'java',
        '.cs': 'csharp',
        '.go': 'go',
        '.rs': 'rust',
        '.php': 'php',
        '.swift': 'swift',
        '.kt': 'kotlin',
        '.scala': 'scala',
        '.r': 'r',
        '.lua': 'lua',
        '.perl': 'perl',
        '.pl': 'perl',
        
        // Config
        '.json': 'json',
        '.yaml': 'yaml',
        '.yml': 'yaml',
        '.toml': 'toml',
        '.xml': 'xml',
        '.ini': 'ini',
        '.env': 'bash',
        
        // Shell/Scripts
        '.sh': 'bash',
        '.bash': 'bash',
        '.zsh': 'bash',
        '.fish': 'bash',
        '.ps1': 'powershell',
        '.bat': 'batch',
        '.cmd': 'batch',
        
        // C/C++
        '.c': 'c',
        '.h': 'c',
        '.cpp': 'cpp',
        '.cc': 'cpp',
        '.cxx': 'cpp',
        '.hpp': 'cpp',
        '.hxx': 'cpp',
        
        // Database
        '.sql': 'sql',
        
        // Documentation
        '.md': 'markdown',
        '.mdx': 'markdown',
        '.rst': 'rst',
        '.tex': 'latex',
        
        // Godot
        '.gd': 'gdscript',
        '.tscn': 'gdscript',
        '.tres': 'gdscript',
        '.cfg': 'ini',
        '.import': 'ini',
        
        // Other
        '.dockerfile': 'dockerfile',
        '.Dockerfile': 'dockerfile',
        '.makefile': 'makefile',
        '.Makefile': 'makefile',
        '.cmake': 'cmake',
        '.gradle': 'gradle',
        '.proto': 'protobuf',
        '.graphql': 'graphql',
        '.gql': 'graphql',
        
        // Files without extensions (by basename)
        'Dockerfile': 'dockerfile',
        'dockerfile': 'dockerfile',
        'Makefile': 'makefile',
        'makefile': 'makefile',
        'CMakeLists.txt': 'cmake',
        'Rakefile': 'ruby',
        'Gemfile': 'ruby',
        'Vagrantfile': 'ruby',
        'Jenkinsfile': 'groovy',
        '.gitignore': 'text',
        '.gitattributes': 'text',
        '.htaccess': 'apache',
        'nginx.conf': 'nginx',
        'requirements.txt': 'text',
        'Cargo.lock': 'toml',
        'Cargo.toml': 'toml',
        'go.mod': 'go',
        'go.sum': 'text',
    };
    
    const lang = languageMap[extensionOrBasename.toLowerCase()] || languageMap[extensionOrBasename];
    return lang || 'text';  // Default to 'text' for unknown extensions
}