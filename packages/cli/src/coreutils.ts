/**
 * Shared utilities for Project Fusion
 */
import fs from 'fs-extra';
import path from 'path';
import { z } from 'zod';
import { ConfigSchemaV1 } from './schema.js';
import crypto from 'crypto';

/**
 * Main configuration interface
 */
export interface Config {
  fusion: {
    directory: string;
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
    [key: string]: string[];
  };
  parsing: {
    parseSubDirectories: boolean;
    rootDirectory: string;
  };
  schemaVersion: number;
  useProjectFusionIgnoreForExcludes: boolean;
  useGitIgnoreForExcludes: boolean;
}

/**
 * Default configuration for Project Fusion
 */
export const defaultConfig: Config = {
  fusion: {
    directory: "./.project-fusion/fusion",
    fusion_file: "project_files_fusioned.txt",
    fusion_log: "fusion.log",
    copyToClipboard: true
  },
  parsedFileExtensions: {
    backend: [".cs", ".go", ".java", ".php", ".py", ".rb", ".rs"],
    config: [".json", ".toml", ".xml", ".yaml", ".yml"],
    cpp: [".c", ".cc", ".cpp", ".h", ".hpp"],
    scripts: [".bat", ".cmd", ".ps1", ".sh"],
    web: [".css", ".html", ".js", ".jsx", ".svelte", ".ts", ".tsx", ".vue"]
  },
  parsing: {
    parseSubDirectories: true,
    rootDirectory: "."
  },
  schemaVersion: 1,
  useProjectFusionIgnoreForExcludes: true,
  useGitIgnoreForExcludes: true
};

/**
 * Default .projectfusionignore content
 */
export const defaultProjectFusionIgnoreContent = `# Project Fusion files
/.project-fusion/
project-fusion.json

# Credentials and environment variables
.env
.env.*
**/credentials/*

# Secret configuration
**/secrets/*
**/config/secrets.json

# Key files
*.pem
*.key

# Package files
package-lock.json
pnpm-lock.yaml
node_modules

# Build output
**/dist
**/build

# Log files
*.log
`;

/**
 * Load config from file
 * @returns The loaded configuration
 */
export async function loadConfig(): Promise<Config> {
  try {
    const configPath = path.resolve('./project-fusion.json');
    const configExists = await fs.pathExists(configPath);
    
    if (!configExists) {
      console.warn(`Config file not found at ${configPath}, using default configuration.`);
      return defaultConfig;
    }
    
    const configContent = await fs.readFile(configPath, 'utf8');
    const parsedConfig = JSON.parse(configContent);
        
    // Validate with Zod schema
    try {
      const validatedConfig = ConfigSchemaV1.parse(parsedConfig);
      return validatedConfig;
    } catch (zodError) {
      if (zodError instanceof z.ZodError) {
        console.warn('Configuration validation failed (will use default config):', zodError.format());
      } else {
        console.warn('Unknown validation error (will use default config):', zodError);
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
 * Calculate SHA-256 hash of a string
 * @param content Content to hash
 * @returns SHA-256 hash
 */
export function calculateHash(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex');
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
 * @returns Formatted timestamp
 */
export function formatTimestamp(): string {
  return new Date().toISOString();
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