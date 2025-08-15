/**
 * Utilities for Project Fusion
 */
import fs from 'fs-extra';
import path from 'path';
import { z } from 'zod';
import { ConfigSchemaV1 } from './schema.js';
import { Config } from './types.js';


/**
 * Default configuration for Project Fusion
 */
export const defaultConfig = {
    fusion: {
        fusion_file: "project-fusioned.txt",
        fusion_log: "project-fusion.log",
        copyToClipboard: false
    },
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
        rootDirectory: "."
    },
    ignorePatterns: [
        "project-fusion.json",
        "project-fusion.log",
        "project-fusioned.txt",
        "project-fusioned.md",
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
        "*.swo"
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

        // Validate with Zod schema
        try {
            const validatedConfig = ConfigSchemaV1.parse(parsedConfig);
            return validatedConfig;
        } catch (zodError: unknown) {
            if (zodError instanceof z.ZodError) {
                console.error('Configuration validation failed (will use default config):', zodError.format());
            } else {
                console.error('Unknown validation error (will use default config):', zodError);
            }
            console.error('Parsed config that failed validation:', JSON.stringify(parsedConfig, null, 2));
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
 * Amélioration du système de logging - pour synchroniser terminal et fichier log
 * @param logFilePath Chemin du fichier log
 * @param content Contenu à logger
 * @param append Si true, ajoute au fichier existant
 * @param consoleOutput Si true, affiche également sur la console
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

        // Afficher aussi sur la console si demandé
        if (consoleOutput) {
            console.log(content);
        }
    } catch (error) {
        console.error('Error writing log:', error);
        // Ne pas throw d'erreur pour ne pas interrompre le processus principal
    }
}

/**
 * Journalisation d'erreur améliorée - pour voir les erreurs dans les logs ET le terminal
 * @param logFilePath Chemin du fichier log
 * @param message Message d'erreur
 * @param error L'erreur elle-même (optionnelle)
 */
export async function logError(
    logFilePath: string,
    message: string,
    error?: Error
): Promise<void> {
    const errorMsg = `❌ ERROR: ${message}`;
    console.error(errorMsg);

    await writeLog(logFilePath, errorMsg, true);

    if (error) {
        console.error(`  Details: ${error.message}`);
        console.error(`  Stack: ${error.stack}`);

        await writeLog(logFilePath, `  Details: ${error.message}`, true);
        await writeLog(logFilePath, `  Stack: ${error.stack}`, true);
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
        // If no groups specified, use all extension groups
        return Object.values(config.parsedFileExtensions).flat();
    }

    // Get extensions from specified groups
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
 * Map file extensions to markdown code block languages
 * @param extension File extension (e.g., '.ts', '.json')
 * @returns Markdown language identifier or empty string for text
 */
export function getMarkdownLanguage(extension: string): string {
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
    };
    
    const lang = languageMap[extension.toLowerCase()];
    return lang || 'text';  // Default to 'text' for unknown extensions
}