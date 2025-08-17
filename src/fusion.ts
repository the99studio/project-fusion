// SPDX-License-Identifier: MIT
// Copyright (c) 2025 the99studio
/**
 * Fusion functionality - Refactored with new architecture patterns
 */
import path from 'node:path';
import ignoreLib from 'ignore';
import { DefaultFileSystemAdapter, type FileSystemAdapter } from './adapters/file-system.js';
import { BenchmarkTracker } from './benchmark.js';
import { PluginManager } from './plugins/plugin-system.js';
import { 
    OutputStrategyManager, 
    type FileInfo, 
    type OutputContext 
} from './strategies/output-strategy.js';
import { createFilePath, type Config, type FilePath, type FusionOptions, type FusionResult } from './types.js';
import {
    formatLocalTimestamp,
    formatTimestamp,
    getExtensionsFromGroups,
    isBinaryFile,
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

        if (options.pluginsDir) {
            await pluginManager.loadPluginsFromDirectory(options.pluginsDir);
        }

        if (options.enabledPlugins) {
            for (const pluginName of options.enabledPlugins) {
                pluginManager.configurePlugin(pluginName, { name: pluginName, enabled: true });
            }
        }

        await pluginManager.initializePlugins(config);

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
        console.log(`Processing ${extensions.length} file extensions from ${Object.keys(mergedConfig.parsedFileExtensions).length} categories`);
        
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
            const endTime = new Date();
            await writeLog(logFilePath, `Status: Fusion failed\nReason: ${message}\nStart time: ${formatTimestamp(startTime)}\nEnd time: ${formatTimestamp(endTime)}\nDuration: ${((endTime.getTime() - startTime.getTime()) / 1000).toFixed(2)}s`, true);
            return { success: false, message, logFilePath };
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

        const maxFileSizeKB = config.maxFileSizeKB;
        const filesToProcess: FileInfo[] = [];
        const skippedFiles: string[] = [];
        let skippedCount = 0;
        let totalSizeBytes = 0;

        for (const filePath of filePaths) {
            const relativePath = path.relative(rootDir, filePath);

            try {
                const stats = await fs.stat(filePath);
                const sizeKB = stats.size / 1024;
                totalSizeBytes += stats.size;

                if (sizeKB > maxFileSizeKB) {
                    skippedCount++;
                    skippedFiles.push(relativePath);
                    await writeLog(logFilePath, `Skipped large file: ${relativePath} (${sizeKB.toFixed(2)} KB)`, true);
                } else {
                    const safePath = validateSecurePath(filePath, config.rootDirectory);
                    await validateNoSymlinks(createFilePath(safePath), false);
                    
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

        const beforeFusionResult = await pluginManager.executeBeforeFusion(mergedConfig, filesToProcess);
        const finalConfig = beforeFusionResult.config;
        const finalFilesToProcess = beforeFusionResult.filesToProcess;

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

        const message = `Fusion completed successfully. ${finalFilesToProcess.length} files processed${skippedCount > 0 ? `, ${skippedCount} skipped` : ''}.`;
        const endTime = new Date();
        const duration = ((endTime.getTime() - startTime.getTime()) / 1000).toFixed(2);
        const totalSizeMB = (totalSizeBytes / (1024 * 1024)).toFixed(2);
        
        await writeLog(logFilePath, `Status: Fusion completed successfully`, true);
        await writeLog(logFilePath, `Start time: ${formatTimestamp(startTime)}`, true);
        await writeLog(logFilePath, `End time: ${formatTimestamp(endTime)}`, true);
        await writeLog(logFilePath, `Duration: ${duration}s`, true);
        await writeLog(logFilePath, `Total data processed: ${totalSizeMB} MB`, true);
        
        const metrics = benchmark.getMetrics();
        await writeLog(logFilePath, `\nPerformance Metrics:`, true);
        await writeLog(logFilePath, `  Memory Used: ${metrics.memoryUsed.toFixed(2)} MB`, true);
        await writeLog(logFilePath, `  Throughput: ${metrics.throughputMBps.toFixed(2)} MB/s`, true);
        await writeLog(logFilePath, `  Files/second: ${(metrics.filesProcessed / metrics.duration).toFixed(2)}`, true);
        
        await writeLog(logFilePath, `Files found: ${originalFileCount}`, true);
        await writeLog(logFilePath, `Files processed successfully: ${finalFilesToProcess.length}`, true);
        await writeLog(logFilePath, `Files skipped (too large): ${skippedCount}`, true);
        await writeLog(logFilePath, `Files filtered out: ${originalFileCount - filePaths.length}`, true);
        
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