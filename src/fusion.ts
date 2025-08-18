// SPDX-License-Identifier: MIT
// Copyright (c) 2025 the99studio
/**
 * Fusion functionality - Refactored with new architecture patterns
 */
import path from 'node:path';

import ignoreLib from 'ignore';

import { type FileSystemAdapter, DefaultFileSystemAdapter } from './adapters/file-system.js';
import { BenchmarkTracker } from './benchmark.js';
import { PluginManager } from './plugins/plugin-system.js';
import { 
    type FileInfo, 
    type OutputContext,
    OutputStrategyManager
} from './strategies/output-strategy.js';
import { type Config, type FilePath, type FusionOptions, type FusionResult, createFilePath } from './types.js';
import {
    formatLocalTimestamp,
    formatTimestamp,
    generateHelpfulEmptyMessage,
    getExtensionsFromGroups,
    isBinaryFile,
    logMemoryUsageIfNeeded,
    validateNoSymlinks,
    validateSecurePath,
    writeLog
} from './utils.js';

export async function processFusion(
    config: Config,
    options: FusionOptions = {}
): Promise<FusionResult> {
    const benchmark = new BenchmarkTracker();
    const fs = options.fs || new DefaultFileSystemAdapter();
    const outputManager = new OutputStrategyManager();
    const pluginManager = new PluginManager(fs);

    try {
        const logFilePath = createFilePath(path.resolve(config.rootDirectory, `${config.generatedFileName}.log`));
        const startTime = new Date();

        await fs.writeFile(logFilePath, '');
        
        // Log initial configuration and session info
        await writeLog(logFilePath, `=== PROJECT FUSION SESSION START ===`, true);
        await writeLog(logFilePath, `Session ID: ${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`, true);
        await writeLog(logFilePath, `Start time: ${formatTimestamp(startTime)}`, true);
        await writeLog(logFilePath, `Working directory: ${config.rootDirectory}`, true);
        await writeLog(logFilePath, `Generated file name: ${config.generatedFileName}`, true);
        
        await writeLog(logFilePath, `\n--- CONFIGURATION ---`, true);
        await writeLog(logFilePath, `Output formats:`, true);
        await writeLog(logFilePath, `  - Text (.txt): ${config.generateText}`, true);
        await writeLog(logFilePath, `  - Markdown (.md): ${config.generateMarkdown}`, true);
        await writeLog(logFilePath, `  - HTML (.html): ${config.generateHtml}`, true);
        
        await writeLog(logFilePath, `Processing limits:`, true);
        await writeLog(logFilePath, `  - Max file size: ${config.maxFileSizeKB} KB`, true);
        await writeLog(logFilePath, `  - Max files: ${config.maxFiles}`, true);
        await writeLog(logFilePath, `  - Max total size: ${config.maxTotalSizeMB} MB`, true);
        
        await writeLog(logFilePath, `Directory scanning:`, true);
        await writeLog(logFilePath, `  - Parse subdirectories: ${config.parseSubDirectories}`, true);
        await writeLog(logFilePath, `  - Use .gitignore: ${config.useGitIgnoreForExcludes}`, true);
        await writeLog(logFilePath, `  - Allow symlinks: ${config.allowSymlinks}`, true);
        
        if (config.ignorePatterns.length > 0) {
            await writeLog(logFilePath, `Ignore patterns: ${config.ignorePatterns.join(', ')}`, true);
        }
        
        if (options.extensionGroups) {
            await writeLog(logFilePath, `Extension groups filter: ${options.extensionGroups.join(', ')}`, true);
        }

        if (options.pluginsDir) {
            await pluginManager.loadPluginsFromDirectory(options.pluginsDir);
        }

        if (options.enabledPlugins) {
            for (const pluginName of options.enabledPlugins) {
                pluginManager.configurePlugin(pluginName, { name: pluginName, enabled: true });
            }
        }

        await pluginManager.initializePlugins(config);
        
        // Log plugin information
        const loadedPlugins = pluginManager.listPlugins();
        const enabledPlugins = pluginManager.getEnabledPlugins();
        
        if (options.pluginsDir || options.enabledPlugins) {
            await writeLog(logFilePath, `\n--- PLUGINS ---`, true);
            if (options.pluginsDir) {
                await writeLog(logFilePath, `Plugin directory: ${options.pluginsDir}`, true);
            }
            if (loadedPlugins.length > 0) {
                await writeLog(logFilePath, `Loaded plugins: ${loadedPlugins.length}`, true);
                for (const plugin of loadedPlugins) {
                    const isEnabled = enabledPlugins.some(p => p.metadata.name === plugin.name);
                    await writeLog(logFilePath, `  - ${plugin.name} v${plugin.version} (${isEnabled ? 'enabled' : 'disabled'})`, true);
                }
            } else {
                await writeLog(logFilePath, `No plugins loaded`, true);
            }
        }

        const additionalStrategies = pluginManager.getAdditionalOutputStrategies();
        for (const strategy of additionalStrategies) {
            outputManager.registerStrategy(strategy);
        }

        const additionalExtensions = pluginManager.getAdditionalFileExtensions();
        const mergedConfig = {
            ...config,
            parsedFileExtensions: {
                ...config.parsedFileExtensions,
                ...additionalExtensions
            }
        };

        const extensions = getExtensionsFromGroups(mergedConfig, options.extensionGroups);
        
        // Log processing information
        await writeLog(logFilePath, `\n--- PROCESSING ---`, true);
        console.log(`Processing ${extensions.length} file extensions from ${Object.keys(mergedConfig.parsedFileExtensions).length} categories`);
        await writeLog(logFilePath, `File extensions to process: ${extensions.length}`, true);
        await writeLog(logFilePath, `Available extension categories: ${Object.keys(mergedConfig.parsedFileExtensions).length}`, true);
        
        if (additionalExtensions && Object.keys(additionalExtensions).length > 0) {
            await writeLog(logFilePath, `Additional extensions from plugins: ${Object.keys(additionalExtensions).join(', ')}`, true);
        }
        
        if (additionalStrategies.length > 0) {
            await writeLog(logFilePath, `Additional output strategies from plugins: ${additionalStrategies.map(s => s.name).join(', ')}`, true);
        }
        
        if (extensions.length === 0) {
            const message = 'No file extensions to process.';
            await writeLog(logFilePath, `Status: Fusion failed\nReason: ${message}`, true);
            return { success: false, message, logFilePath };
        }

        const ig = ignoreLib();
        const rootDir = path.resolve(config.rootDirectory);

        if (config.useGitIgnoreForExcludes) {
            const gitIgnorePath = path.join(rootDir, '.gitignore');
            if (await fs.exists(createFilePath(gitIgnorePath))) {
                const gitIgnoreContent = await fs.readFile(createFilePath(gitIgnorePath));
                ig.add(gitIgnoreContent);
            }
        }

        if (config.ignorePatterns.length > 0) {
            const patterns = config.ignorePatterns
                .filter(pattern => pattern.trim() !== '' && !pattern.startsWith('#'))
                .join('\n');
            ig.add(patterns);
        }

        const allExtensionsPattern = extensions.map(ext => ext.startsWith('.') ? ext : `.${ext}`);
        const pattern = config.parseSubDirectories
            ? `${rootDir}/**/*@(${allExtensionsPattern.join('|')})`
            : `${rootDir}/*@(${allExtensionsPattern.join('|')})`;

        let filePaths = await fs.glob(pattern, { 
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
            const helpMessage = generateHelpfulEmptyMessage(extensions, mergedConfig);
            const endTime = new Date();
            await writeLog(logFilePath, `Status: Fusion failed\nReason: ${message}\nStart time: ${formatTimestamp(startTime)}\nEnd time: ${formatTimestamp(endTime)}\nDuration: ${((endTime.getTime() - startTime.getTime()) / 1000).toFixed(2)}s`, true);
            return { 
                success: false, 
                message: `${message}\n\n${helpMessage}`, 
                logFilePath 
            };
        }

        const projectName = path.basename(process.cwd());
        let packageName = "";
        let projectVersion = "";
        const packageJsonPath = path.join(process.cwd(), 'package.json');
        if (await fs.exists(createFilePath(packageJsonPath))) {
            try {
                const packageJsonContent = await fs.readFile(createFilePath(packageJsonPath));
                const packageJson = JSON.parse(packageJsonContent) as Record<string, unknown>;
                if (typeof packageJson['name'] === 'string') {
                    packageName = packageJson['name'];
                }
                if (typeof packageJson['version'] === 'string') {
                    projectVersion = packageJson['version'];
                }
            } catch (error) {
                console.warn('Error reading package.json:', error);
            }
        }

        filePaths.sort((a, b) => path.relative(rootDir, a).localeCompare(path.relative(rootDir, b)));

        // Initial memory check
        await logMemoryUsageIfNeeded(logFilePath, 'Initial memory check');

        // Check resource limits early
        if (filePaths.length > config.maxFiles) {
            const message = `Too many files found (${filePaths.length} > ${config.maxFiles}). ` +
                `Consider using more specific --include patterns or increasing maxFiles in config.`;
            await writeLog(logFilePath, message, true);
            return {
                success: false,
                error: message,
                message,
                code: 'TOO_MANY_FILES' as const,
                details: {
                    filesFound: filePaths.length,
                    maxFiles: config.maxFiles,
                    suggestion: 'Use --include patterns to filter files or increase maxFiles limit'
                }
            };
        }

        const maxFileSizeKB = config.maxFileSizeKB;
        const maxTotalSizeBytes = config.maxTotalSizeMB * 1024 * 1024;
        const filesToProcess: FileInfo[] = [];
        const skippedFiles: string[] = [];
        let skippedCount = 0;
        let totalSizeBytes = 0;

        for (const filePath of filePaths) {
            const relativePath = path.relative(rootDir, filePath);

            try {
                const stats = await fs.stat(filePath);
                const sizeKB = stats.size / 1024;
                
                // Check if adding this file would exceed total size limit
                if (totalSizeBytes + stats.size > maxTotalSizeBytes) {
                    const totalSizeMB = (totalSizeBytes + stats.size) / (1024 * 1024);
                    const message = `Total size limit exceeded (${totalSizeMB.toFixed(2)} MB > ${config.maxTotalSizeMB} MB). ` +
                        `Consider using more specific --include patterns or increasing maxTotalSizeMB in config.`;
                    await writeLog(logFilePath, message, true);
                    return {
                        success: false,
                        error: message,
                        message,
                        code: 'SIZE_LIMIT_EXCEEDED' as const,
                        details: {
                            totalSizeMB: totalSizeMB,
                            maxTotalSizeMB: config.maxTotalSizeMB,
                            filesProcessed: filesToProcess.length,
                            suggestion: 'Use --include patterns to filter files or increase maxTotalSizeMB limit'
                        }
                    };
                }
                
                totalSizeBytes += stats.size;

                if (sizeKB > maxFileSizeKB) {
                    skippedCount++;
                    skippedFiles.push(relativePath);
                    await writeLog(logFilePath, `Skipped large file: ${relativePath} (${sizeKB.toFixed(2)} KB)`, true);
                } else {
                    const safePath = validateSecurePath(filePath, config.rootDirectory);
                    await validateNoSymlinks(createFilePath(safePath), config.allowSymlinks);
                    
                    if (await isBinaryFile(safePath)) {
                        await writeLog(logFilePath, `Skipping binary file: ${relativePath}`, true);
                        console.warn(`Skipping binary file: ${relativePath}`);
                        continue;
                    }
                    
                    const content = await fs.readFile(createFilePath(safePath));
                    
                    let fileInfo: FileInfo = {
                        content,
                        relativePath,
                        path: filePath,
                        size: stats.size
                    };

                    fileInfo = await pluginManager.executeBeforeFileProcessing(fileInfo, config) || fileInfo;
                    
                    if (fileInfo) {
                        filesToProcess.push(fileInfo);
                    }
                }
            } catch (error) {
                await writeLog(logFilePath, `Error checking file ${filePath}: ${String(error)}`, true);
                console.error(`Error checking file ${filePath}:`, error);
            }
        }

        // Memory check after file processing
        await logMemoryUsageIfNeeded(logFilePath, 'After file processing');

        const beforeFusionResult = await pluginManager.executeBeforeFusion(mergedConfig, filesToProcess);
        const finalConfig = beforeFusionResult.config;
        const finalFilesToProcess = beforeFusionResult.filesToProcess;

        // Handle preview mode - show files and exit without generating output
        if (options.previewMode) {
            const endTime = new Date();
            const duration = ((endTime.getTime() - startTime.getTime()) / 1000).toFixed(2);
            
            await writeLog(logFilePath, `\n--- PREVIEW MODE RESULTS ---`, true);
            await writeLog(logFilePath, `Files that would be processed: ${finalFilesToProcess.length}`, true);
            
            if (finalFilesToProcess.length === 0) {
                await writeLog(logFilePath, `No files found matching the criteria.`, true);
                const message = `Preview completed: No files found matching your criteria.`;
                await writeLog(logFilePath, `Status: ${message}`, true);
                await writeLog(logFilePath, `Duration: ${duration}s`, true);
                return { 
                    success: false, 
                    message: `${message}\n\n${generateHelpfulEmptyMessage(extensions, mergedConfig)}`, 
                    logFilePath 
                };
            }
            
            // Group files by extension for better display
            const filesByExtension: Record<string, string[]> = {};
            for (const file of finalFilesToProcess) {
                const ext = path.extname(file.path).toLowerCase() || 'no extension';
                if (!filesByExtension[ext]) {
                    filesByExtension[ext] = [];
                }
                filesByExtension[ext].push(file.relativePath);
            }
            
            for (const [ext, files] of Object.entries(filesByExtension)) {
                await writeLog(logFilePath, `  ${ext}: ${files.length} files`, true);
                for (const file of files.slice(0, 5)) { // Show first 5 files
                    await writeLog(logFilePath, `    - ${file}`, true);
                }
                if (files.length > 5) {
                    await writeLog(logFilePath, `    ... and ${files.length - 5} more`, true);
                }
            }
            
            const message = `Preview completed: ${finalFilesToProcess.length} files would be processed.`;
            await writeLog(logFilePath, `Status: ${message}`, true);
            await writeLog(logFilePath, `Duration: ${duration}s`, true);
            
            return { 
                success: true, 
                message, 
                logFilePath,
                fusionFilePath: logFilePath
            };
        }

        // Check if no files to process and provide helpful message
        if (finalFilesToProcess.length === 0) {
            const endTime = new Date();
            const duration = ((endTime.getTime() - startTime.getTime()) / 1000).toFixed(2);
            
            // If we found files initially but all were skipped (due to size/binary/etc), 
            // this is a successful operation with 0 files processed
            if (filePaths.length > 0) {
                const message = `Fusion completed successfully. 0 files processed${skippedCount > 0 ? `, ${skippedCount} skipped` : ''}.`;
                await writeLog(logFilePath, `Status: Fusion completed successfully\nFiles processed: 0\nFiles skipped: ${skippedCount}\nStart time: ${formatTimestamp(startTime)}\nEnd time: ${formatTimestamp(endTime)}\nDuration: ${duration}s`, true);
                
                return { 
                    success: true, 
                    message, 
                    logFilePath,
                    fusionFilePath: logFilePath 
                };
            } else {
                // No files found at all - this is a failure
                const message = 'No files found matching your criteria.';
                const helpMessage = generateHelpfulEmptyMessage(extensions, mergedConfig);
                await writeLog(logFilePath, `Status: Fusion failed\nReason: ${message}\nStart time: ${formatTimestamp(startTime)}\nEnd time: ${formatTimestamp(endTime)}\nDuration: ${duration}s`, true);
                return { 
                    success: false, 
                    message: `${message}\n\n${helpMessage}`, 
                    logFilePath 
                };
            }
        }

        const projectTitle = packageName && packageName.toLowerCase() !== projectName.toLowerCase() 
            ? `${projectName} / ${packageName}` 
            : projectName;
        const versionInfo = projectVersion ? ` v${projectVersion}` : '';

        const outputContext: OutputContext = {
            projectTitle,
            versionInfo,
            filesToProcess: finalFilesToProcess,
            config: finalConfig
        };

        const enabledStrategies = outputManager.getEnabledStrategies(finalConfig);
        const generatedPaths: FilePath[] = [];

        for (const strategy of enabledStrategies) {
            try {
                const outputPath = await outputManager.generateOutput(strategy, outputContext, fs);
                generatedPaths.push(outputPath);
                benchmark.markFileProcessed(0);
            } catch (error) {
                await writeLog(logFilePath, `Error generating ${strategy.name} output: ${String(error)}`, true);
                console.error(`Error generating ${strategy.name} output:`, error);
            }
        }

        // Final memory check
        await logMemoryUsageIfNeeded(logFilePath, 'Final memory check');

        const message = `Fusion completed successfully. ${finalFilesToProcess.length} files processed${skippedCount > 0 ? `, ${skippedCount} skipped` : ''}.`;
        const endTime = new Date();
        const duration = ((endTime.getTime() - startTime.getTime()) / 1000).toFixed(2);
        const totalSizeMB = (totalSizeBytes / (1024 * 1024)).toFixed(2);
        
        await writeLog(logFilePath, `Status: Fusion completed successfully`, true);
        await writeLog(logFilePath, `Start time: ${formatTimestamp(startTime)}`, true);
        await writeLog(logFilePath, `End time: ${formatTimestamp(endTime)}`, true);
        await writeLog(logFilePath, `Duration: ${duration}s`, true);
        await writeLog(logFilePath, `Total data processed: ${totalSizeMB} MB`, true);
        
        // File type statistics
        const fileTypeStats: Record<string, { count: number; sizeKB: number }> = {};
        let binaryFilesCount = 0;
        
        for (const fileInfo of finalFilesToProcess) {
            const ext = path.extname(fileInfo.path).toLowerCase();
            const displayExt = ext || 'no extension';
            
            if (!fileTypeStats[displayExt]) {
                fileTypeStats[displayExt] = { count: 0, sizeKB: 0 };
            }
            fileTypeStats[displayExt].count++;
            fileTypeStats[displayExt].sizeKB += fileInfo.size / 1024;
        }
        
        await writeLog(logFilePath, `\n--- FILE TYPE STATISTICS ---`, true);
        await writeLog(logFilePath, `Files found: ${originalFileCount}`, true);
        await writeLog(logFilePath, `Files processed successfully: ${finalFilesToProcess.length}`, true);
        await writeLog(logFilePath, `Files skipped (too large): ${skippedCount}`, true);
        await writeLog(logFilePath, `Files filtered out: ${originalFileCount - filePaths.length}`, true);
        
        if (Object.keys(fileTypeStats).length > 0) {
            await writeLog(logFilePath, `\nFile types processed:`, true);
            const sortedStats = Object.entries(fileTypeStats)
                .sort(([,a], [,b]) => b.count - a.count);
                
            for (const [ext, stats] of sortedStats) {
                await writeLog(logFilePath, `  ${ext}: ${stats.count} files (${stats.sizeKB.toFixed(2)} KB)`, true);
            }
        }
        
        if (skippedFiles.length > 0) {
            await writeLog(logFilePath, `\nSkipped files (too large):`, true);
            for (const file of skippedFiles.slice(0, 10)) { // Limit to first 10
                await writeLog(logFilePath, `  - ${file}`, true);
            }
            if (skippedFiles.length > 10) {
                await writeLog(logFilePath, `  ... and ${skippedFiles.length - 10} more`, true);
            }
        }
        
        const metrics = benchmark.getMetrics();
        await writeLog(logFilePath, `\n--- PERFORMANCE METRICS ---`, true);
        await writeLog(logFilePath, `Duration breakdown:`, true);
        await writeLog(logFilePath, `  Total execution: ${duration}s`, true);
        await writeLog(logFilePath, `  File discovery: ${((Date.now() - startTime.getTime()) / 1000 / parseFloat(duration) * 100).toFixed(1)}% of total`, true);
        
        await writeLog(logFilePath, `Memory usage:`, true);
        await writeLog(logFilePath, `  Peak memory: ${metrics.memoryUsed.toFixed(2)} MB`, true);
        await writeLog(logFilePath, `  Memory per file: ${finalFilesToProcess.length > 0 ? (metrics.memoryUsed / finalFilesToProcess.length * 1024).toFixed(2) : '0'} KB`, true);
        
        await writeLog(logFilePath, `Processing speed:`, true);
        await writeLog(logFilePath, `  Data throughput: ${metrics.throughputMBps.toFixed(2)} MB/s`, true);
        await writeLog(logFilePath, `  File processing rate: ${(metrics.filesProcessed / metrics.duration).toFixed(2)} files/s`, true);
        await writeLog(logFilePath, `  Average file size: ${finalFilesToProcess.length > 0 ? (totalSizeBytes / finalFilesToProcess.length / 1024).toFixed(2) : '0'} KB`, true);
        
        await writeLog(logFilePath, `Output generation:`, true);
        const outputFormats = enabledStrategies.map(s => s.name).join(', ');
        await writeLog(logFilePath, `  Generated formats: ${outputFormats}`, true);
        await writeLog(logFilePath, `  Number of output files: ${enabledStrategies.length}`, true);
        
        const generatedFormats = enabledStrategies.map(s => s.extension);
        
        const result = {
            success: true as const,
            message: `${message} Generated formats: ${generatedFormats.join(', ')}.`,
            fusionFilePath: generatedPaths[0] || logFilePath,
            logFilePath
        };

        const finalResult = await pluginManager.executeAfterFusion(result, finalConfig);
        
        await pluginManager.cleanupPlugins();
        
        return finalResult;

    } catch (error) {
        const errorMessage = `Fusion process failed: ${String(error)}`;
        console.error(errorMessage);

        try {
            await pluginManager.cleanupPlugins();
        } catch (cleanupError) {
            console.error('Error during plugin cleanup:', cleanupError);
        }

        try {
            let logFilePath: FilePath;
            try {
                logFilePath = createFilePath(path.resolve(config.rootDirectory, `${config.generatedFileName}.log`));
                const endTime = new Date();
                await writeLog(logFilePath, `Status: Fusion failed due to error\nError details: ${errorMessage}\nEnd time: ${formatTimestamp(endTime)}`, true);
            } catch {
                logFilePath = createFilePath(path.resolve(`${config.generatedFileName}.log`));
                const endTime = new Date();
                await writeLog(logFilePath, `Status: Fusion failed due to error\nError details: ${errorMessage}\nEnd time: ${formatTimestamp(endTime)}`, true);
            }

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