/**
 * Fusion functionality - Optimized single-file-in-memory approach
 */
import fs from 'fs-extra';
import { createWriteStream } from 'fs';
import { glob } from 'glob';
import ignoreLib from 'ignore';
import path from 'path';
import { BenchmarkTracker } from './benchmark.js';
import {
    formatTimestamp,
    getExtensionsFromGroups,
    getMarkdownLanguage,
    readFileContentWithSizeLimit,
    writeLog,
    logConfigSummary,
    ensureDirectoryExists
} from './utils.js';
import {
    Config,
    FusionOptions,
    FusionResult,
    createFilePath
} from './types.js';

/**
 * Process fusion of files - Optimized memory-efficient version
 * @param config Configuration
 * @param options Fusion options
 * @returns Fusion result
 */
export async function processFusion(
    config: Config,
    options: FusionOptions = {}
): Promise<FusionResult> {
    const benchmark = new BenchmarkTracker();
    
    try {
        const { fusion, parsing } = config;
        const logFilePath = createFilePath(path.resolve(fusion.fusion_log));
        const fusionFilePath = createFilePath(path.resolve(fusion.fusion_file));
        const mdFilePath = createFilePath(fusionFilePath.replace('.txt', '.md'));
        const startTime = new Date();

        await fs.writeFile(logFilePath, '');
        
        // Log configuration summary at the beginning
        await logConfigSummary(logFilePath, config);

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

        // Extract project metadata for the fusion header
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

        // Track which extensions are actually used vs configured vs unknown
        const foundExtensions = new Set<string>();
        const otherExtensions = new Set<string>();

        // Discover all file extensions in the project for reporting
        const allFilesPattern = parsing.parseSubDirectories ? `${rootDir}/**/*.*` : `${rootDir}/*.*`;
        const allFiles = await glob(allFilesPattern, { nodir: true, follow: false });

        const allConfiguredExtensions = Object.values(config.parsedFileExtensions).flat();
        const configuredExtensionSet = new Set(allConfiguredExtensions);
        for (const file of allFiles) {
            const relativePath = path.relative(rootDir, file);
            const ext = path.extname(file).toLowerCase();

            if (ext && !ig.ignores(relativePath) && !configuredExtensionSet.has(ext)) {
                otherExtensions.add(ext);
            }
        }

        // First pass: check file sizes and build list of files to process
        const maxFileSizeKB = parsing.maxFileSizeKB;
        const filesToProcess: { path: string; relativePath: string; size: number }[] = [];
        const skippedFiles: string[] = [];
        let skippedCount = 0;
        let totalSizeBytes = 0;

        for (const filePath of filePaths) {
            const relativePath = path.relative(rootDir, filePath);
            const fileExt = path.extname(filePath).toLowerCase();
            foundExtensions.add(fileExt);

            try {
                const stats = await fs.stat(filePath);
                const sizeKB = stats.size / 1024;
                totalSizeBytes += stats.size;

                if (sizeKB > maxFileSizeKB) {
                    skippedCount++;
                    skippedFiles.push(relativePath);
                    await writeLog(logFilePath, `Skipped large file: ${relativePath} (${sizeKB.toFixed(2)} KB)`, true);
                } else {
                    filesToProcess.push({ path: filePath, relativePath, size: stats.size });
                }
            } catch (error) {
                await writeLog(logFilePath, `Error checking file ${filePath}: ${error}`, true);
                console.error(`Error checking file ${filePath}:`, error);
            }
        }

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
            `# Files: ${filesToProcess.length}\n\n`;

        const mdHeader = `# Generated Project Fusion File\n` +
            (packageName && packageName.toLowerCase() !== projectName.toLowerCase()
                ? `**Project:** ${projectName} / ${packageName}\n\n`
                : `**Project:** ${projectName}\n\n`) +
            `**Generated:** ${formatTimestamp()}\n\n` +
            `**Files:** ${filesToProcess.length}\n\n` +
            `---\n\n## 📁 Table of Contents\n\n`;

        txtStream.write(txtHeader);
        mdStream.write(mdHeader);

        // Write table of contents for markdown (only for files that will be processed)
        for (const fileInfo of filesToProcess) {
            mdStream.write(`- [${fileInfo.relativePath}](#${fileInfo.relativePath.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()})\n`);
        }
        mdStream.write(`\n---\n\n`);

        // Process files one by one - memory efficient approach
        let processedCount = 0;
        for (const fileInfo of filesToProcess) {
            try {
                // Read file content - only one file in memory at a time
                const content = await fs.readFile(fileInfo.path, 'utf8');
                
                // Write to text file
                txtStream.write(`<!-- ============================================================ -->\n`);
                txtStream.write(`<!-- FILE: ${fileInfo.relativePath.padEnd(54)} -->\n`);
                txtStream.write(`<!-- ============================================================ -->\n`);
                txtStream.write(`${content}\n\n`);

                // Write to markdown file
                const fileExt = path.extname(fileInfo.path).toLowerCase();
                const basename = path.basename(fileInfo.path);
                const language = getMarkdownLanguage(fileExt || basename);
                
                mdStream.write(`## 📄 ${fileInfo.relativePath}\n\n`);
                mdStream.write(`\`\`\`${language}\n`);
                mdStream.write(`${content}\n`);
                mdStream.write(`\`\`\`\n\n`);

                processedCount++;
                benchmark.markFileProcessed(fileInfo.size);
            } catch (error) {
                await writeLog(logFilePath, `Error processing file ${fileInfo.path}: ${error}`, true);
                console.error(`Error processing file ${fileInfo.path}:`, error);
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
        const message = `Fusion completed successfully. ${processedCount} files processed${skippedCount > 0 ? `, ${skippedCount} skipped` : ''}.`;
        const endTime = new Date();
        const duration = ((endTime.getTime() - startTime.getTime()) / 1000).toFixed(2);
        const totalSizeMB = (totalSizeBytes / (1024 * 1024)).toFixed(2);
        
        await writeLog(logFilePath, `Status: Fusion completed successfully`, true);
        await writeLog(logFilePath, `Start time: ${formatTimestamp(startTime)}`, true);
        await writeLog(logFilePath, `End time: ${formatTimestamp(endTime)}`, true);
        await writeLog(logFilePath, `Duration: ${duration}s`, true);
        await writeLog(logFilePath, `Total data processed: ${totalSizeMB} MB`, true);
        
        // Add benchmark metrics
        const metrics = benchmark.getMetrics();
        await writeLog(logFilePath, `\nPerformance Metrics:`, true);
        await writeLog(logFilePath, `  Memory Used: ${metrics.memoryUsed.toFixed(2)} MB`, true);
        await writeLog(logFilePath, `  Throughput: ${metrics.throughputMBps.toFixed(2)} MB/s`, true);
        await writeLog(logFilePath, `  Files/second: ${(metrics.filesProcessed / metrics.duration).toFixed(2)}`, true);
        
        await writeLog(logFilePath, `Files found: ${originalFileCount}`, true);
        await writeLog(logFilePath, `Files processed successfully: ${processedCount}`, true);
        await writeLog(logFilePath, `Files skipped (too large): ${skippedCount}`, true);
        await writeLog(logFilePath, `Files filtered out: ${originalFileCount - filePaths.length}`, true);
        
        await writeLog(logFilePath, `Max file size limit: ${maxFileSizeKB} KB`, true);
        
        if (skippedFiles.length > 0) {
            await writeLog(logFilePath, `Skipped files:`, true);
            for (const file of skippedFiles.slice(0, 10)) {
                await writeLog(logFilePath, `  ${file}`, true);
            }
            if (skippedFiles.length > 10) {
                await writeLog(logFilePath, `  ... and ${skippedFiles.length - 10} more`, true);
            }
        }
        
        await writeLog(logFilePath, `File extensions actually processed:`, true);
        const foundExtArray = Array.from(foundExtensions).sort();
        for (const ext of foundExtArray) {
            await writeLog(logFilePath, `  ${ext}`, true);
        }
        
        const ignoredExtensions = extensions.filter(ext => !Array.from(foundExtensions).includes(ext));
        if (ignoredExtensions.length > 0) {
            await writeLog(logFilePath, `Configured extensions with no matching files found:`, true);
            for (const ext of ignoredExtensions.sort()) {
                await writeLog(logFilePath, `  ${ext}`, true);
            }
        }
        
        if (otherExtensions.size > 0) {
            await writeLog(logFilePath, `File extensions found in project but not configured for processing:`, true);
            for (const ext of Array.from(otherExtensions).sort()) {
                await writeLog(logFilePath, `  ${ext}`, true);
            }
        }
        
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
            await writeLog(logFilePath, `Status: Fusion failed due to error\nError details: ${errorMessage}\nEnd time: ${formatTimestamp(endTime)}`, true);

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