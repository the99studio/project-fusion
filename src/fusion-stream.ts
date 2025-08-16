/**
 * Streaming fusion functionality for large projects
 */
import fs from 'fs-extra';
import { glob } from 'glob';
import ignoreLib from 'ignore';
import path from 'path';
import { createWriteStream, createReadStream } from 'fs';
import { pipeline } from 'stream/promises';
import { Transform } from 'stream';
import {
    formatTimestamp,
    getExtensionsFromGroups,
    getMarkdownLanguage,
    readFileContentWithSizeLimit,
    ensureDirectoryExists,
    writeLog
} from './utils.js';
import {
    Config,
    FileInfo,
    FusionOptions,
    FusionResult,
    createFilePath
} from './types.js';

/**
 * Process fusion of files with streaming support
 * @param config Configuration
 * @param options Fusion options
 * @returns Fusion result
 */
export async function processFusionStream(
    config: Config,
    options: FusionOptions = {}
): Promise<FusionResult> {
    try {
        const { fusion, parsing } = config;
        const logFilePath = createFilePath(path.resolve(fusion.fusion_log));
        const fusionFilePath = createFilePath(path.resolve(fusion.fusion_file));
        const mdFilePath = createFilePath(fusionFilePath.replace('.txt', '.md'));
        const startTime = new Date();
        const maxFileSizeKB = parsing.maxFileSizeKB;

        await fs.writeFile(logFilePath, '');

        const extensions = getExtensionsFromGroups(config, options.extensionGroups);
        console.log(`Processing ${extensions.length} file extensions from ${Object.keys(config.parsedFileExtensions).length} categories`);
        
        if (extensions.length === 0) {
            const message = 'No file extensions to process.';
            await writeLog(logFilePath, `Status: Fusion failed\nReason: ${message}`, true);
            return { success: false, message, logFilePath };
        }

        const ig = ignoreLib();
        const rootDir = path.resolve(parsing.rootDirectory);

        // Apply .gitignore patterns for filtering if enabled
        if (config.useGitIgnoreForExcludes) {
            const gitIgnorePath = path.join(rootDir, '.gitignore');
            if (await fs.pathExists(gitIgnorePath)) {
                const gitIgnoreContent = await fs.readFile(gitIgnorePath, 'utf8');
                ig.add(gitIgnoreContent);
            }
        }

        if (config.ignorePatterns.length > 0) {
            const patterns = config.ignorePatterns
                .filter(pattern => pattern.trim() !== '' && !pattern.startsWith('#'))
                .join('\n');
            ig.add(patterns);
        }

        // Build glob pattern for file discovery
        const allExtensionsPattern = extensions.map(ext => ext.startsWith('.') ? ext : `.${ext}`);
        const pattern = parsing.parseSubDirectories
            ? `${rootDir}/**/*@(${allExtensionsPattern.join('|')})`
            : `${rootDir}/*@(${allExtensionsPattern.join('|')})`;

        let filePaths = await glob(pattern, { 
            nodir: true,
            follow: false
        });
        
        const originalFileCount = filePaths.length;
        filePaths = filePaths.filter(file => {
            const relativePath = path.relative(rootDir, file);
            return !ig.ignores(relativePath);
        });
        
        console.log(`Found ${originalFileCount} files, ${filePaths.length} after filtering (${((originalFileCount - filePaths.length) / originalFileCount * 100).toFixed(1)}% filtered)`);

        if (filePaths.length === 0) {
            const message = 'No files found to process.';
            const endTime = new Date();
            await writeLog(logFilePath, `Status: Fusion failed\nReason: ${message}\nStart time: ${formatTimestamp(startTime)}\nEnd time: ${formatTimestamp(endTime)}\nDuration: ${((endTime.getTime() - startTime.getTime()) / 1000).toFixed(2)}s`, true);
            return { success: false, message, logFilePath };
        }

        // Extract project metadata
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

        // Sort files for consistent output
        filePaths.sort((a, b) => path.relative(rootDir, a).localeCompare(path.relative(rootDir, b)));

        // Ensure output directories exist
        await ensureDirectoryExists(path.dirname(fusionFilePath));
        await ensureDirectoryExists(path.dirname(mdFilePath));

        // Create write streams for both output files
        const txtStream = createWriteStream(fusionFilePath);
        const mdStream = createWriteStream(mdFilePath);

        // Write headers
        const txtHeader = `# Generated Project Fusion File\n` +
            (packageName && packageName.toLowerCase() !== projectName.toLowerCase() 
                ? `# Project: ${projectName} / ${packageName}\n` 
                : `# Project: ${projectName}\n`) +
            `# @${formatTimestamp()}\n` +
            `# Files: ${filePaths.length}\n\n`;

        const mdHeader = `# Generated Project Fusion File\n` +
            (packageName && packageName.toLowerCase() !== projectName.toLowerCase()
                ? `**Project:** ${projectName} / ${packageName}\n\n`
                : `**Project:** ${projectName}\n\n`) +
            `**Generated:** ${formatTimestamp()}\n\n` +
            `**Files:** ${filePaths.length}\n\n` +
            `---\n\n## 📁 Table of Contents\n\n`;

        txtStream.write(txtHeader);
        mdStream.write(mdHeader);

        // Write table of contents for markdown
        for (const filePath of filePaths) {
            const relativePath = path.relative(rootDir, filePath);
            mdStream.write(`- [${relativePath}](#${relativePath.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()})\n`);
        }
        mdStream.write(`\n---\n\n`);

        // Process files with streaming
        let processedCount = 0;
        let skippedCount = 0;
        let totalSizeBytes = 0;
        const foundExtensions = new Set<string>();
        const skippedFiles: string[] = [];

        for (const filePath of filePaths) {
            try {
                const relativePath = path.relative(rootDir, filePath);
                const fileExt = path.extname(filePath).toLowerCase();
                const basename = path.basename(filePath);
                foundExtensions.add(fileExt);

                // Check file size and read content
                const { content, skipped, size } = await readFileContentWithSizeLimit(filePath, maxFileSizeKB);
                totalSizeBytes += size;

                if (skipped) {
                    skippedCount++;
                    skippedFiles.push(relativePath);
                    
                    // Write placeholder for skipped files
                    txtStream.write(`<!-- ============================================================ -->\n`);
                    txtStream.write(`<!-- FILE: ${relativePath.padEnd(54)} -->\n`);
                    txtStream.write(`<!-- SKIPPED: File too large (${(size / 1024).toFixed(2)} KB)        -->\n`);
                    txtStream.write(`<!-- ============================================================ -->\n\n`);
                    
                    mdStream.write(`## 📄 ${relativePath}\n\n`);
                    mdStream.write(`> ⚠️ File skipped: Too large (${(size / 1024).toFixed(2)} KB)\n\n`);
                    
                    await writeLog(logFilePath, `Skipped large file: ${relativePath} (${(size / 1024).toFixed(2)} KB)`, true);
                    continue;
                }

                if (content !== null) {
                    // Write to text file
                    txtStream.write(`<!-- ============================================================ -->\n`);
                    txtStream.write(`<!-- FILE: ${relativePath.padEnd(54)} -->\n`);
                    txtStream.write(`<!-- ============================================================ -->\n`);
                    txtStream.write(`${content}\n\n`);

                    // Write to markdown file
                    const language = getMarkdownLanguage(fileExt || basename);
                    mdStream.write(`## 📄 ${relativePath}\n\n`);
                    mdStream.write(`\`\`\`${language}\n`);
                    mdStream.write(`${content}\n`);
                    mdStream.write(`\`\`\`\n\n`);

                    processedCount++;
                }
            } catch (error) {
                await writeLog(logFilePath, `Error processing file ${filePath}: ${error}`, true);
                console.error(`Error processing file ${filePath}:`, error);
            }
        }

        // Close streams
        await new Promise<void>((resolve, reject) => {
            txtStream.end((err: any) => err ? reject(err) : resolve());
        });
        await new Promise<void>((resolve, reject) => {
            mdStream.end((err: any) => err ? reject(err) : resolve());
        });

        // Generate comprehensive log summary
        const message = `Fusion completed successfully. ${processedCount} files processed, ${skippedCount} skipped.`;
        const endTime = new Date();
        const duration = ((endTime.getTime() - startTime.getTime()) / 1000).toFixed(2);
        const totalSizeMB = (totalSizeBytes / (1024 * 1024)).toFixed(2);
        
        await writeLog(logFilePath, `Status: Fusion completed successfully`, true);
        await writeLog(logFilePath, `Start time: ${formatTimestamp(startTime)}`, true);
        await writeLog(logFilePath, `End time: ${formatTimestamp(endTime)}`, true);
        await writeLog(logFilePath, `Duration: ${duration}s`, true);
        await writeLog(logFilePath, `Total data processed: ${totalSizeMB} MB`, true);
        
        await writeLog(logFilePath, `Files found: ${originalFileCount}`, true);
        await writeLog(logFilePath, `Files processed successfully: ${processedCount}`, true);
        await writeLog(logFilePath, `Files skipped (too large): ${skippedCount}`, true);
        await writeLog(logFilePath, `Files filtered out: ${originalFileCount - filePaths.length}`, true);
        
        await writeLog(logFilePath, `Max file size limit: ${maxFileSizeKB} KB`, true);
        
        if (skippedFiles.length > 0) {
            await writeLog(logFilePath, `Skipped files:`, true);
            for (const file of skippedFiles) {
                await writeLog(logFilePath, `  ${file}`, true);
            }
        }
        
        await writeLog(logFilePath, `File extensions processed:`, true);
        const foundExtArray = Array.from(foundExtensions).sort();
        for (const ext of foundExtArray) {
            await writeLog(logFilePath, `  ${ext}`, true);
        }
        
        await writeLog(logFilePath, `Configuration used:`, true);
        await writeLog(logFilePath, `  Root directory: ${parsing.rootDirectory}`, true);
        await writeLog(logFilePath, `  Scan subdirectories: ${parsing.parseSubDirectories ? 'Yes' : 'No'}`, true);
        await writeLog(logFilePath, `  Apply .gitignore rules: ${config.useGitIgnoreForExcludes ? 'Yes' : 'No'}`, true);
        await writeLog(logFilePath, `  Custom ignore patterns: ${config.ignorePatterns.length} patterns`, true);
        
        await writeLog(logFilePath, `Output files generated:`, true);
        await writeLog(logFilePath, `  Plain text: ${fusionFilePath}`, true);
        await writeLog(logFilePath, `  Markdown: ${mdFilePath}`, true);

        return {
            success: true,
            message: `${message} Created both .txt and .md versions.`,
            fusionFilePath,
            logFilePath
        };
    } catch (error) {
        const errorMessage = `Fusion process failed: ${error}`;
        console.error(errorMessage);

        try {
            const logFilePath = createFilePath(path.resolve(config.fusion.fusion_log));
            const endTime = new Date();
            await writeLog(logFilePath, `Status: Fusion failed\nError: ${errorMessage}\nEnd time: ${formatTimestamp(endTime)}`, true);

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