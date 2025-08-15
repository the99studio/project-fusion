/**
 * Fusion functionality
 */
import fs from 'fs-extra';
import { glob } from 'glob';
import ignoreLib from 'ignore';
import path from 'path';
import {
    calculateHash,
    ensureDirectoryExists,
    formatTimestamp,
    getExtensionsFromGroups,
    readFileContent,
    writeFileContent,
    writeLog
} from './utils.js';
import {
    Config,
    FileInfo,
    FusionOptions,
    FusionResult,
    createFilePath,
    createFileHash
} from './types.js';

/**
 * Process fusion of files
 * @param config Configuration
 * @param options Fusion options
 * @returns Fusion result
 */
export async function processFusion(
    config: Config,
    options: FusionOptions = {}
): Promise<FusionResult> {
    try {
        const { fusion, parsing } = config;
        const logFilePath = createFilePath(path.resolve(fusion.fusion_log));
        const fusionFilePath = createFilePath(path.resolve(fusion.fusion_file));

        // Clear previous log
        await writeLog(logFilePath, `--- Fusion Process Started (${formatTimestamp()}) ---`);

        // Determine which extensions to process
        const extensions = getExtensionsFromGroups(config, options.extensionGroups);
        console.log(`Processing ${extensions.length} file extensions from ${Object.keys(config.parsedFileExtensions).length} categories`);
        
        if (extensions.length === 0) {
            const message = 'No file extensions to process.';
            await writeLog(logFilePath, message, true);
            return { success: false, message, logFilePath };
        }

        await writeLog(logFilePath, `Processing extensions: ${extensions.join(', ')}`, true);

        // Initialize ignore filter instance
        const ig = ignoreLib();

        // Get the root directory
        const rootDir = path.resolve(parsing.rootDirectory);

        // Get .gitignore patterns if enabled
        if (config.useGitIgnoreForExcludes) {
            const gitIgnorePath = path.join(rootDir, '.gitignore');
            if (await fs.pathExists(gitIgnorePath)) {
                const gitIgnoreContent = await fs.readFile(gitIgnorePath, 'utf8');
                ig.add(gitIgnoreContent);
            }
        }

        // Add ignore patterns from config
        if (config.ignorePatterns && config.ignorePatterns.length > 0) {
            // Filter out comments and empty lines, then add to ignore
            const patterns = config.ignorePatterns
                .filter(pattern => pattern.trim() !== '' && !pattern.startsWith('#'))
                .join('\n');
            ig.add(patterns);
        }

        // Find all files with matching extensions
        const allExtensionsPattern = extensions.map(ext => ext.startsWith('.') ? ext : `.${ext}`);
        const pattern = parsing.parseSubDirectories
            ? `${rootDir}/**/*@(${allExtensionsPattern.join('|')})`
            : `${rootDir}/*@(${allExtensionsPattern.join('|')})`;

        let filePaths = await glob(pattern, { 
            nodir: true
        });
        
        // Filter out ignored files using the ignore instance
        const originalFileCount = filePaths.length;
        filePaths = filePaths.filter(file => {
            const relativePath = path.relative(rootDir, file);
            return !ig.ignores(relativePath);
        });
        console.log(`Found ${originalFileCount} files, ${filePaths.length} after filtering (${((originalFileCount - filePaths.length) / originalFileCount * 100).toFixed(1)}% filtered)`);

        if (filePaths.length === 0) {
            const message = 'No files found to process.';
            await writeLog(logFilePath, message, true);
            return { success: false, message, logFilePath };
        }

        await writeLog(logFilePath, `Found ${filePaths.length} files to process.`, true);

        // Get project and package name
        const projectName = path.basename(process.cwd());
        let packageName = "";
        const packageJsonPath = path.join(process.cwd(), 'package.json');
        if (await fs.pathExists(packageJsonPath)) {
            try {
                const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
                if (packageJson.name) {
                    packageName = packageJson.name;
                }
            } catch (error) {
                console.warn('Error reading package.json:', error);
            }
        }

        // Track extensions
        const foundExtensions = new Set<string>();
        const otherExtensions = new Set<string>();

        // Find all files in the project to check for other extensions
        const allFilesPattern = parsing.parseSubDirectories ? `${rootDir}/**/*.*` : `${rootDir}/*.*`;
        const allFiles = await glob(allFilesPattern, { nodir: true });

        // Get all configured extensions
        const allConfiguredExtensions = Object.values(config.parsedFileExtensions).flat();
        const configuredExtensionSet = new Set(allConfiguredExtensions);

        // Find other extensions in the project that aren't in the configured set
        // and aren't in ignored directories
        for (const file of allFiles) {
            const relativePath = path.relative(rootDir, file);
            const ext = path.extname(file).toLowerCase();

            if (ext && !ig.ignores(relativePath) && !configuredExtensionSet.has(ext)) {
                otherExtensions.add(ext);
            }
        }

        // Read file contents and calculate hashes
        const fileInfos: FileInfo[] = [];
        for (const filePath of filePaths) {
            try {
                const content = await readFileContent(filePath);
                const relativePath = path.relative(rootDir, filePath);
                const hash = calculateHash(content);

                // Extract file extension
                const fileExt = path.extname(filePath).toLowerCase();
                foundExtensions.add(fileExt);

                fileInfos.push({
                    path: createFilePath(relativePath),
                    content,
                    hash: createFileHash(hash)
                });

                await writeLog(logFilePath, `Processed: ${relativePath} (Hash: ${hash})`, true);
            } catch (error) {
                await writeLog(logFilePath, `Error processing file ${filePath}: ${error}`, true);
                console.error(`Error processing file ${filePath}:`, error);
            }
        }

        // Sort fileInfos by path
        fileInfos.sort((a, b) => a.path.localeCompare(b.path));

        // Build simplified fusion content
        let fusionContent = `# Generated Project Fusion File\n`;
        if (packageName && packageName.toLowerCase() !== projectName.toLowerCase()) {
            fusionContent += `# Project: ${projectName} / ${packageName}\n`;
        } else {
            fusionContent += `# Project: ${projectName}\n`;
        }
        fusionContent += `# @${formatTimestamp()}\n`;
        fusionContent += `# Files: ${fileInfos.length}\n\n`;

        for (const fileInfo of fileInfos) {
            fusionContent += `### ${fileInfo.path}\n`;
            fusionContent += `# Hash: ${fileInfo.hash}\n`;
            fusionContent += `${fileInfo.content}\n\n`;
        }

        // Write fusion file
        await writeFileContent(fusionFilePath, fusionContent);

        // Prepare simplified extension information for log
        let extensionsInfo = "";
        extensionsInfo += `Parsed extensions: ${Array.from(foundExtensions).sort().join(', ')}\n`;

        if (otherExtensions.size > 0) {
            extensionsInfo += `Ignored extensions: ${Array.from(otherExtensions).sort().join(', ')}\n`;
        }

        // Write success message and extension info to log
        const message = `Fusion completed successfully. ${fileInfos.length} files processed.`;
        await writeLog(logFilePath, message, true);
        await writeLog(logFilePath, `--- Fusion Process Completed (${formatTimestamp()}) ---`, true);
        await writeLog(logFilePath, extensionsInfo, true);
        
        // Add detailed summary
        await writeLog(logFilePath, `\n=== FUSION SUMMARY ===`, true);
        await writeLog(logFilePath, `Total extensions configured: ${extensions.length}`, true);
        await writeLog(logFilePath, `Extensions by category:`, true);
        Object.entries(config.parsedFileExtensions).forEach(([category, exts]) => {
            writeLog(logFilePath, `  ${category}: ${exts.join(', ')}`, true);
        });
        await writeLog(logFilePath, `\nFile discovery:`, true);
        await writeLog(logFilePath, `  Pattern used: ${pattern}`, true);
        await writeLog(logFilePath, `  Files found before filtering: ${originalFileCount}`, true);
        await writeLog(logFilePath, `  Files after ignore filtering: ${fileInfos.length}`, true);
        await writeLog(logFilePath, `  Filtering efficiency: ${((originalFileCount - fileInfos.length) / originalFileCount * 100).toFixed(1)}% files filtered out`, true);
        await writeLog(logFilePath, `\nConfiguration used:`, true);
        await writeLog(logFilePath, `  Root directory: ${rootDir}`, true);
        await writeLog(logFilePath, `  Parse subdirectories: ${parsing.parseSubDirectories}`, true);
        await writeLog(logFilePath, `  Use .gitignore: ${config.useGitIgnoreForExcludes}`, true);
        await writeLog(logFilePath, `  Ignore patterns count: ${config.ignorePatterns.length}`, true);
        await writeLog(logFilePath, `======================\n`, true);

        return {
            success: true,
            message,
            fusionFilePath,
            logFilePath
        };
    } catch (error) {
        const errorMessage = `Fusion process failed: ${error}`;
        console.error(errorMessage);

        try {
            const logFilePath = createFilePath(path.resolve(config.fusion.fusion_log));
            await writeLog(logFilePath, errorMessage, true);
            await writeLog(logFilePath, `--- Fusion Process Failed (${formatTimestamp()}) ---`, true);

            return {
                success: false,
                message: errorMessage,
                logFilePath,
                error: error as Error
            };
        } catch (logError) {
            console.error('Could not write to log file:', logError);
            return {
                success: false,
                message: errorMessage,
                error: error as Error
            };
        }
    }
}